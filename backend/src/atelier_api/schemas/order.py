import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from atelier_api.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    slug: str
    size: str
    quantity: int = Field(ge=1, le=20)


class OrderCreate(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    address: str = Field(min_length=1, max_length=250)
    city: str = Field(min_length=1, max_length=120)
    postal_code: str = Field(min_length=1, max_length=20)
    country: str = Field(min_length=1, max_length=120)
    items: list[OrderItemCreate] = Field(min_length=1, max_length=50)


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_slug: str
    name: str
    price: int
    size: str
    quantity: int


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID | None
    email: str
    first_name: str
    last_name: str
    address: str
    city: str
    postal_code: str
    country: str
    subtotal: int
    shipping: int
    total: int
    status: OrderStatus
    created_at: datetime
    items: list[OrderItemRead]


class OrderCheckoutResponse(BaseModel):
    """Returned by POST /orders. `checkout_url` is set only when Stripe is
    configured — the frontend redirects the browser there. When it's null,
    `order` is already `paid` (the no-Stripe-configured demo fallback) and
    the frontend goes straight to the confirmation screen.
    """

    order: OrderRead
    checkout_url: str | None
