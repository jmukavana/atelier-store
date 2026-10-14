from fastapi import APIRouter, status

from atelier_api.api.deps import DbSession
from atelier_api.crud import newsletter as crud_newsletter
from atelier_api.schemas.newsletter import (
    NewsletterSubscribeRequest,
    NewsletterSubscribeResponse,
)

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


@router.post(
    "", response_model=NewsletterSubscribeResponse, status_code=status.HTTP_201_CREATED
)
async def subscribe(
    payload: NewsletterSubscribeRequest, db: DbSession
) -> NewsletterSubscribeResponse:
    await crud_newsletter.subscribe(db, payload.email)
    return NewsletterSubscribeResponse(email=payload.email, subscribed=True)
