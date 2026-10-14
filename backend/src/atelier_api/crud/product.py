import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from atelier_api.exceptions import ConflictError, ProductNotFoundError
from atelier_api.models.product import Category, Product
from atelier_api.schemas.product import ProductCreate, ProductUpdate

SORT_COLUMNS = {
    "newest": Product.created_at.desc(),
    "price_asc": Product.price.asc(),
    "price_desc": Product.price.desc(),
}


async def list_products(
    db: AsyncSession,
    *,
    category: Category | None = None,
    is_new: bool | None = None,
    search: str | None = None,
    sort: str = "newest",
    limit: int = 24,
    offset: int = 0,
) -> tuple[list[Product], int]:
    query = select(Product)
    count_query = select(func.count()).select_from(Product)

    if category is not None:
        query = query.where(Product.category == category)
        count_query = count_query.where(Product.category == category)
    if is_new is not None:
        query = query.where(Product.is_new == is_new)
        count_query = count_query.where(Product.is_new == is_new)
    if search:
        pattern = f"%{search}%"
        query = query.where(Product.name.ilike(pattern))
        count_query = count_query.where(Product.name.ilike(pattern))

    query = query.order_by(SORT_COLUMNS.get(sort, SORT_COLUMNS["newest"]))
    query = query.limit(limit).offset(offset)

    total = (await db.execute(count_query)).scalar_one()
    items = (await db.execute(query)).scalars().all()
    return list(items), total


async def get_by_slug(db: AsyncSession, slug: str) -> Product:
    product = (
        await db.execute(select(Product).where(Product.slug == slug))
    ).scalar_one_or_none()
    if product is None:
        raise ProductNotFoundError(f"Product '{slug}' was not found.")
    return product


async def get_related(db: AsyncSession, product: Product, limit: int = 4) -> list[Product]:
    query = (
        select(Product)
        .where(Product.category == product.category, Product.slug != product.slug)
        .limit(limit)
    )
    return list((await db.execute(query)).scalars().all())


async def get_all_slugs(db: AsyncSession) -> list[str]:
    result = await db.execute(select(Product.slug))
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, product_id: uuid.UUID) -> Product:
    product = (
        await db.execute(select(Product).where(Product.id == product_id))
    ).scalar_one_or_none()
    if product is None:
        raise ProductNotFoundError(f"Product '{product_id}' was not found.")
    return product


async def _assert_slug_available(
    db: AsyncSession, slug: str, *, exclude_id: uuid.UUID | None = None
) -> None:
    query = select(Product.id).where(Product.slug == slug)
    if exclude_id is not None:
        query = query.where(Product.id != exclude_id)
    existing = (await db.execute(query)).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(f"A product with slug '{slug}' already exists.")


async def create_product(db: AsyncSession, payload: ProductCreate) -> Product:
    await _assert_slug_available(db, payload.slug)
    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def update_product(
    db: AsyncSession, product_id: uuid.UUID, payload: ProductUpdate
) -> Product:
    product = await get_by_id(db, product_id)
    changes = payload.model_dump(exclude_unset=True)
    if "slug" in changes and changes["slug"] != product.slug:
        await _assert_slug_available(db, changes["slug"], exclude_id=product_id)
    for field, value in changes.items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return product


async def delete_product(db: AsyncSession, product_id: uuid.UUID) -> None:
    product = await get_by_id(db, product_id)
    await db.delete(product)
    await db.commit()
