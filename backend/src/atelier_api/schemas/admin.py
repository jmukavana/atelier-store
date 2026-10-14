from datetime import date

from pydantic import BaseModel

from atelier_api.models.product import Category
from atelier_api.schemas.order import OrderRead
from atelier_api.schemas.user import UserRead


class AdminOrderList(BaseModel):
    items: list[OrderRead]
    total: int
    limit: int
    offset: int


class AdminUserList(BaseModel):
    items: list[UserRead]
    total: int
    limit: int
    offset: int


class AdminStats(BaseModel):
    total_revenue: int
    """Sum of `total` across paid orders only, in whole dollars."""
    order_count: int
    paid_order_count: int
    product_count: int
    user_count: int
    recent_orders: list[OrderRead]


class RevenuePoint(BaseModel):
    period: date
    revenue: int
    order_count: int


class CategoryRevenue(BaseModel):
    category: Category
    revenue: int
    quantity: int


class FinanceSummary(BaseModel):
    total_revenue: int
    paid_order_count: int
    average_order_value: int
    pending_payment_count: int
    pending_payment_value: int


class TransactionList(BaseModel):
    items: list["TransactionRead"]
    total: int
    limit: int
    offset: int


class TransactionRead(BaseModel):
    order_id: str
    created_at: str
    customer_email: str
    subtotal: int
    shipping: int
    total: int
    status: str
    payment_method: str
    """"stripe" if the order has a Stripe session, "demo" otherwise (see
    core/payments.py — checkout falls back to an instant demo payment when
    Stripe isn't configured)."""
