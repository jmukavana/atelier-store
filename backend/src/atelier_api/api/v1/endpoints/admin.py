import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Query, status

from atelier_api.api.deps import DbSession, get_current_admin
from atelier_api.core.config import get_settings
from atelier_api.crud import admin as crud_admin
from atelier_api.crud import newsletter as crud_newsletter
from atelier_api.crud import order as crud_order
from atelier_api.crud import product as crud_product
from atelier_api.crud import user as crud_user
from atelier_api.schemas.admin import (
    AdminOrderList,
    AdminStats,
    AdminUserList,
    CategoryRevenue,
    FinanceSummary,
    RevenuePoint,
    TransactionList,
)
from atelier_api.schemas.newsletter import NewsletterSubscriberRead
from atelier_api.schemas.order import OrderRead
from atelier_api.schemas.product import (
    ProductCreate,
    ProductList,
    ProductRead,
    ProductUpdate,
)
from atelier_api.schemas.user import UserRead

router = APIRouter(
    prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)]
)
settings = get_settings()


@router.get("/stats", response_model=AdminStats)
async def get_stats(db: DbSession) -> AdminStats:
    return await crud_admin.get_stats(db)


# --- Products -----------------------------------------------------------


@router.get("/products", response_model=ProductList)
async def list_products(
    db: DbSession,
    search: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=50, ge=1, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
) -> ProductList:
    items, total = await crud_product.list_products(
        db, search=search, sort="newest", limit=limit, offset=offset
    )
    return ProductList(
        items=[ProductRead.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate, db: DbSession) -> ProductRead:
    product = await crud_product.create_product(db, payload)
    return ProductRead.model_validate(product)


@router.get("/products/{product_id}", response_model=ProductRead)
async def get_product(product_id: uuid.UUID, db: DbSession) -> ProductRead:
    product = await crud_product.get_by_id(db, product_id)
    return ProductRead.model_validate(product)


@router.patch("/products/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: uuid.UUID, payload: ProductUpdate, db: DbSession
) -> ProductRead:
    product = await crud_product.update_product(db, product_id, payload)
    return ProductRead.model_validate(product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: uuid.UUID, db: DbSession) -> None:
    await crud_product.delete_product(db, product_id)


# --- Orders ---------------------------------------------------------------


@router.get("/orders", response_model=AdminOrderList)
async def list_orders(
    db: DbSession,
    limit: int = Query(default=24, ge=1, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
) -> AdminOrderList:
    orders, total = await crud_order.list_all_orders(db, limit=limit, offset=offset)
    return AdminOrderList(
        items=[OrderRead.model_validate(order) for order in orders],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/orders/{order_id}", response_model=OrderRead)
async def get_order(order_id: uuid.UUID, db: DbSession) -> OrderRead:
    order = await crud_order.get_order(db, order_id)
    return OrderRead.model_validate(order)


# --- Customers --------------------------------------------------------------


@router.get("/users", response_model=AdminUserList)
async def list_users(
    db: DbSession,
    limit: int = Query(default=24, ge=1, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
) -> AdminUserList:
    users, total = await crud_user.list_users(db, limit=limit, offset=offset)
    return AdminUserList(
        items=[UserRead.model_validate(user) for user in users],
        total=total,
        limit=limit,
        offset=offset,
    )


# --- Newsletter -------------------------------------------------------------


@router.get("/newsletter", response_model=list[NewsletterSubscriberRead])
async def list_newsletter_subscribers(db: DbSession) -> list[NewsletterSubscriberRead]:
    subscribers = await crud_newsletter.list_subscribers(db)
    return [NewsletterSubscriberRead.model_validate(s) for s in subscribers]


# --- Finance ------------------------------------------------------------


@router.get("/finance/summary", response_model=FinanceSummary)
async def get_finance_summary(db: DbSession) -> FinanceSummary:
    return await crud_admin.get_finance_summary(db)


@router.get("/finance/revenue", response_model=list[RevenuePoint])
async def get_revenue_series(
    db: DbSession,
    period: Literal["daily", "weekly", "monthly"] = "daily",
    limit: int = Query(default=30, ge=1, le=365),
) -> list[RevenuePoint]:
    return await crud_admin.get_revenue_series(db, period=period, limit=limit)


@router.get("/finance/revenue-by-category", response_model=list[CategoryRevenue])
async def get_revenue_by_category(db: DbSession) -> list[CategoryRevenue]:
    return await crud_admin.get_revenue_by_category(db)


@router.get("/finance/transactions", response_model=TransactionList)
async def list_transactions(
    db: DbSession,
    limit: int = Query(default=24, ge=1, le=settings.max_page_size),
    offset: int = Query(default=0, ge=0),
) -> TransactionList:
    transactions, total = await crud_admin.list_transactions(db, limit=limit, offset=offset)
    return TransactionList(items=transactions, total=total, limit=limit, offset=offset)
