import uuid

import stripe
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from atelier_api.core.config import get_settings
from atelier_api.core.payments import stripe_enabled
from atelier_api.exceptions import AppError, OrderNotFoundError
from atelier_api.models.order import Order, OrderItem, OrderStatus
from atelier_api.models.product import Product
from atelier_api.schemas.order import OrderCreate

SHIPPING_COST = 0
settings = get_settings()


def _price_items(
    payload: OrderCreate, products_by_slug: dict[str, Product]
) -> tuple[list[OrderItem], int]:
    """Turns request line items into priced `OrderItem`s, using each
    product's *current* DB price — never a client-supplied one."""
    order_items: list[OrderItem] = []
    subtotal = 0
    for item in payload.items:
        product = products_by_slug[item.slug]
        if item.size not in product.sizes:
            raise AppError(
                f"Size '{item.size}' is not available for '{product.name}'."
            )
        subtotal += product.price * item.quantity
        order_items.append(
            OrderItem(
                product_slug=product.slug,
                name=product.name,
                price=product.price,
                size=item.size,
                quantity=item.quantity,
            )
        )
    return order_items, subtotal


async def create_order(
    db: AsyncSession, payload: OrderCreate, user_id: uuid.UUID | None = None
) -> tuple[Order, str | None]:
    """Create an order and, if Stripe is configured, a Checkout Session for
    it. Client-supplied prices are never trusted — pricing always comes
    from `Product.price` at the moment of purchase (see `_price_items`).

    Returns `(order, checkout_url)`. When Stripe isn't configured,
    `checkout_url` is `None` and `order.status` is already `paid` — a
    fallback so the app works end-to-end without a Stripe account.
    """
    slugs = {item.slug for item in payload.items}
    products = (
        await db.execute(select(Product).where(Product.slug.in_(slugs)))
    ).scalars().all()
    products_by_slug = {product.slug: product for product in products}

    missing = slugs - products_by_slug.keys()
    if missing:
        raise AppError(f"Unknown product(s): {', '.join(sorted(missing))}")

    order_items, subtotal = _price_items(payload, products_by_slug)

    order = Order(
        user_id=user_id,
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        address=payload.address,
        city=payload.city,
        postal_code=payload.postal_code,
        country=payload.country,
        subtotal=subtotal,
        shipping=SHIPPING_COST,
        total=subtotal + SHIPPING_COST,
        items=order_items,
    )
    db.add(order)
    await db.flush()  # populates order.id without ending the transaction

    checkout_url: str | None = None
    if stripe_enabled():
        session = await stripe.checkout.Session.create_async(
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": item.price * 100,
                        "product_data": {"name": f"{item.name} ({item.size})"},
                    },
                    "quantity": item.quantity,
                }
                for item in order_items
            ],
            customer_email=payload.email,
            success_url=f"{settings.frontend_url}/checkout/success?order_id={order.id}",
            cancel_url=f"{settings.frontend_url}/checkout?cancelled=1",
            metadata={"order_id": str(order.id)},
        )
        order.stripe_session_id = session.id
        checkout_url = session.url
    else:
        order.status = OrderStatus.paid

    await db.commit()
    return order, checkout_url


async def get_order(db: AsyncSession, order_id: uuid.UUID) -> Order:
    order = (
        await db.execute(select(Order).where(Order.id == order_id))
    ).scalar_one_or_none()
    if order is None:
        raise OrderNotFoundError(f"Order '{order_id}' was not found.")

    # Reconcile with Stripe on read rather than relying solely on a webhook
    # (simpler for a demo; a production app should also verify via webhook,
    # since a visitor closing the tab before the redirect back would never
    # hit this code path).
    if (
        order.status == OrderStatus.pending_payment
        and order.stripe_session_id
        and stripe_enabled()
    ):
        session = await stripe.checkout.Session.retrieve_async(order.stripe_session_id)
        if session.payment_status == "paid":
            order.status = OrderStatus.paid
            await db.commit()

    return order


async def list_orders_for_user(db: AsyncSession, user_id: uuid.UUID) -> list[Order]:
    result = await db.execute(
        select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def list_all_orders(
    db: AsyncSession, *, limit: int = 24, offset: int = 0
) -> tuple[list[Order], int]:
    """Admin-only — every order regardless of owner."""
    total = (await db.execute(select(func.count()).select_from(Order))).scalar_one()
    result = await db.execute(
        select(Order).order_by(Order.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all()), total
