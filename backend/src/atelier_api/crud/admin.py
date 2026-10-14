from typing import Literal

from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from atelier_api.models.order import Order, OrderItem, OrderStatus
from atelier_api.models.product import Product
from atelier_api.models.user import User
from atelier_api.schemas.admin import (
    AdminStats,
    CategoryRevenue,
    FinanceSummary,
    RevenuePoint,
    TransactionRead,
)
from atelier_api.schemas.order import OrderRead

RevenuePeriod = Literal["daily", "weekly", "monthly"]
_TRUNC_UNIT: dict[RevenuePeriod, str] = {"daily": "day", "weekly": "week", "monthly": "month"}


async def get_stats(db: AsyncSession) -> AdminStats:
    total_revenue = (
        await db.execute(
            select(func.coalesce(func.sum(Order.total), 0)).where(
                Order.status == OrderStatus.paid
            )
        )
    ).scalar_one()
    order_count = (await db.execute(select(func.count()).select_from(Order))).scalar_one()
    paid_order_count = (
        await db.execute(
            select(func.count()).select_from(Order).where(Order.status == OrderStatus.paid)
        )
    ).scalar_one()
    product_count = (await db.execute(select(func.count()).select_from(Product))).scalar_one()
    user_count = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    recent = (
        await db.execute(select(Order).order_by(Order.created_at.desc()).limit(5))
    ).scalars().all()

    return AdminStats(
        total_revenue=int(total_revenue),
        order_count=order_count,
        paid_order_count=paid_order_count,
        product_count=product_count,
        user_count=user_count,
        recent_orders=[OrderRead.model_validate(order) for order in recent],
    )


async def get_finance_summary(db: AsyncSession) -> FinanceSummary:
    total_revenue, paid_order_count = (
        await db.execute(
            select(func.coalesce(func.sum(Order.total), 0), func.count()).where(
                Order.status == OrderStatus.paid
            )
        )
    ).one()
    pending_value, pending_count = (
        await db.execute(
            select(func.coalesce(func.sum(Order.total), 0), func.count()).where(
                Order.status == OrderStatus.pending_payment
            )
        )
    ).one()

    average = int(total_revenue / paid_order_count) if paid_order_count else 0
    return FinanceSummary(
        total_revenue=int(total_revenue),
        paid_order_count=paid_order_count,
        average_order_value=average,
        pending_payment_count=pending_count,
        pending_payment_value=int(pending_value),
    )


async def get_revenue_series(
    db: AsyncSession, period: RevenuePeriod = "daily", limit: int = 30
) -> list[RevenuePoint]:
    bucket = cast(func.date_trunc(_TRUNC_UNIT[period], Order.created_at), Date).label("bucket")
    query = (
        select(bucket, func.sum(Order.total).label("revenue"), func.count().label("order_count"))
        .where(Order.status == OrderStatus.paid)
        .group_by(bucket)
        .order_by(bucket.desc())
        .limit(limit)
    )
    rows = (await db.execute(query)).all()
    points = [
        RevenuePoint(period=row.bucket, revenue=int(row.revenue), order_count=row.order_count)
        for row in rows
    ]
    return list(reversed(points))  # chronological order, for charting


async def get_revenue_by_category(db: AsyncSession) -> list[CategoryRevenue]:
    revenue_expr = func.sum(OrderItem.price * OrderItem.quantity)
    query = (
        select(
            Product.category,
            revenue_expr.label("revenue"),
            func.sum(OrderItem.quantity).label("quantity"),
        )
        .select_from(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .join(Product, Product.slug == OrderItem.product_slug)
        .where(Order.status == OrderStatus.paid)
        .group_by(Product.category)
        .order_by(revenue_expr.desc())
    )
    rows = (await db.execute(query)).all()
    return [
        CategoryRevenue(category=row.category, revenue=int(row.revenue), quantity=row.quantity)
        for row in rows
    ]


async def list_transactions(
    db: AsyncSession, *, limit: int = 24, offset: int = 0
) -> tuple[list[TransactionRead], int]:
    total = (await db.execute(select(func.count()).select_from(Order))).scalar_one()
    result = await db.execute(
        select(Order).order_by(Order.created_at.desc()).limit(limit).offset(offset)
    )
    orders = result.scalars().all()
    transactions = [
        TransactionRead(
            order_id=str(order.id),
            created_at=order.created_at.isoformat(),
            customer_email=order.email,
            subtotal=order.subtotal,
            shipping=order.shipping,
            total=order.total,
            status=order.status.value,
            payment_method="stripe" if order.stripe_session_id else "demo",
        )
        for order in orders
    ]
    return transactions, total
