from fastapi import APIRouter, status

from atelier_api.api.deps import CurrentUser, DbSession
from atelier_api.crud import wishlist as crud_wishlist
from atelier_api.schemas.product import ProductRead

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=list[ProductRead])
async def list_wishlist(db: DbSession, current_user: CurrentUser) -> list[ProductRead]:
    products = await crud_wishlist.list_products(db, current_user.id)
    return [ProductRead.model_validate(product) for product in products]


@router.get("/slugs", response_model=list[str])
async def list_wishlist_slugs(db: DbSession, current_user: CurrentUser) -> list[str]:
    return await crud_wishlist.list_slugs(db, current_user.id)


@router.post("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def add_to_wishlist(slug: str, db: DbSession, current_user: CurrentUser) -> None:
    await crud_wishlist.add(db, current_user.id, slug)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_wishlist(slug: str, db: DbSession, current_user: CurrentUser) -> None:
    await crud_wishlist.remove(db, current_user.id, slug)
