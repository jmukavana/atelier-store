import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr


class NewsletterSubscribeResponse(BaseModel):
    email: EmailStr
    subscribed: bool


class NewsletterSubscriberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    created_at: datetime
