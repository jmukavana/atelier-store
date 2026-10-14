from typing import Literal

from fastapi import APIRouter, Query

from atelier_api.api.deps import DbSession
from atelier_api.core.config import get_settings
from atelier_api.crud import product as crud_product
from atelier_api.models.product import Category
from atelier_api.schemas.product import ProductList, ProductRead

router = APIRouter(prefix="/products", tags=["products"])
settings = get_settings()


@router.get("", response_model=ProductList)
async def list_products(
    db: DbSession,
    category: Category | None = None,
    is_new: bool | None = None,
    search: str | None = Query(default=None, max_length=100),
    sort: Literal["newest", "price_asc", "price_desc"] = "newest",
    limit: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
) -> ProductList:
    items, total = await crud_product.list_products(
        db,
        category=category,
        is_new=is_new,
        search=search,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    return ProductList(
        items=[ProductRead.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/slugs", response_model=list[str])
async def list_product_slugs(db: DbSession) -> list[str]:
    return await crud_product.get_all_slugs(db)


@router.get("/{slug}", response_model=ProductRead)
async def get_product(slug: str, db: DbSession) -> ProductRead:
    product = await crud_product.get_by_slug(db, slug)
    return ProductRead.model_validate(product)


@router.get("/{slug}/related", response_model=list[ProductRead])
async def get_related_products(
    slug: str, db: DbSession, limit: int = Query(default=4, ge=1, le=20)
) -> list[ProductRead]:
    product = await crud_product.get_by_slug(db, slug)
    related = await crud_product.get_related(db, product, limit=limit)
    return [ProductRead.model_validate(item) for item in related]
