from fastapi import APIRouter

from atelier_api.api.v1.endpoints import (
    admin,
    auth,
    categories,
    health,
    newsletter,
    orders,
    products,
    wishlist,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(products.router)
api_router.include_router(categories.router)
api_router.include_router(auth.router)
api_router.include_router(orders.router)
api_router.include_router(wishlist.router)
api_router.include_router(newsletter.router)
api_router.include_router(admin.router)
