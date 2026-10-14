import uuid

from fastapi import APIRouter, status

from atelier_api.api.deps import CurrentUser, DbSession, OptionalUser
from atelier_api.crud import order as crud_order
from atelier_api.exceptions import ForbiddenError
from atelier_api.schemas.order import OrderCheckoutResponse, OrderCreate, OrderRead

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderCheckoutResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate, db: DbSession, current_user: OptionalUser
) -> OrderCheckoutResponse:
    order, checkout_url = await crud_order.create_order(
        db, payload, user_id=current_user.id if current_user else None
    )
    return OrderCheckoutResponse(
        order=OrderRead.model_validate(order), checkout_url=checkout_url
    )


@router.get("/me", response_model=list[OrderRead])
async def list_my_orders(db: DbSession, current_user: CurrentUser) -> list[OrderRead]:
    orders = await crud_order.list_orders_for_user(db, current_user.id)
    return [OrderRead.model_validate(order) for order in orders]


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: uuid.UUID, db: DbSession, current_user: OptionalUser
) -> OrderRead:
    order = await crud_order.get_order(db, order_id)
    if order.user_id is not None and (
        current_user is None or current_user.id != order.user_id
    ):
        raise ForbiddenError("You do not have access to this order.")
    return OrderRead.model_validate(order)
