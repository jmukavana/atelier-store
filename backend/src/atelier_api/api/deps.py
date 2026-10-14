from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from atelier_api.core.config import get_settings
from atelier_api.crud.user import get_user_by_session_token
from atelier_api.db.session import get_db
from atelier_api.exceptions import ForbiddenError, UnauthorizedError
from atelier_api.models.user import User

DbSession = Annotated[AsyncSession, Depends(get_db)]
settings = get_settings()


async def get_optional_current_user(request: Request, db: DbSession) -> User | None:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        return None
    return await get_user_by_session_token(db, token)


async def get_current_user(request: Request, db: DbSession) -> User:
    user = await get_optional_current_user(request, db)
    if user is None:
        raise UnauthorizedError("Sign in required.")
    return user


OptionalUser = Annotated[User | None, Depends(get_optional_current_user)]
CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_admin(current_user: CurrentUser) -> User:
    if not current_user.is_admin:
        raise ForbiddenError("Admin access required.")
    return current_user


AdminUser = Annotated[User, Depends(get_current_admin)]
