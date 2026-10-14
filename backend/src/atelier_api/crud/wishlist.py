import uuid

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from atelier_api.exceptions import ProductNotFoundError
from atelier_api.models.product import Product
from atelier_api.models.wishlist import WishlistItem


async def add(db: AsyncSession, user_id: uuid.UUID, slug: str) -> None:
    product = (
        await db.execute(select(Product).where(Product.slug == slug))
    ).scalar_one_or_none()
    if product is None:
        raise ProductNotFoundError(f"Product '{slug}' was not found.")

    statement = (
        insert(WishlistItem)
        .values(user_id=user_id, product_id=product.id)
        .on_conflict_do_nothing(constraint="uq_wishlist_user_product")
    )
    await db.execute(statement)
    await db.commit()


async def remove(db: AsyncSession, user_id: uuid.UUID, slug: str) -> None:
    product = (
        await db.execute(select(Product).where(Product.slug == slug))
    ).scalar_one_or_none()
    if product is None:
        return

    item = (
        await db.execute(
            select(WishlistItem).where(
                WishlistItem.user_id == user_id, WishlistItem.product_id == product.id
            )
        )
    ).scalar_one_or_none()
    if item is not None:
        await db.delete(item)
        await db.commit()


async def list_products(db: AsyncSession, user_id: uuid.UUID) -> list[Product]:
    result = await db.execute(
        select(Product)
        .join(WishlistItem, WishlistItem.product_id == Product.id)
        .where(WishlistItem.user_id == user_id)
        .order_by(WishlistItem.created_at.desc())
    )
    return list(result.scalars().all())


async def list_slugs(db: AsyncSession, user_id: uuid.UUID) -> list[str]:
    result = await db.execute(
        select(Product.slug)
        .join(WishlistItem, WishlistItem.product_id == Product.id)
        .where(WishlistItem.user_id == user_id)
    )
    return list(result.scalars().all())
