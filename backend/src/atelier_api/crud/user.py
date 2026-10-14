from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from atelier_api.core.config import get_settings
from atelier_api.core.security import (
    generate_session_token,
    hash_password,
    verify_password,
)
from atelier_api.exceptions import ConflictError, UnauthorizedError
from atelier_api.models.session import UserSession
from atelier_api.models.user import User
from atelier_api.schemas.user import UserCreate

settings = get_settings()


async def create_user(db: AsyncSession, payload: UserCreate) -> User:
    existing = (
        await db.execute(select(User).where(User.email == payload.email))
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError("An account with this email already exists.")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = (
        await db.execute(select(User).where(User.email == email))
    ).scalar_one_or_none()
    if user is None or not verify_password(password, user.hashed_password):
        raise UnauthorizedError("Incorrect email or password.")
    return user


async def create_session(db: AsyncSession, user: User) -> UserSession:
    session = UserSession(
        token=generate_session_token(),
        user_id=user.id,
        expires_at=datetime.now(UTC)
        + timedelta(seconds=settings.session_max_age_seconds),
    )
    db.add(session)
    await db.commit()
    return session


async def get_user_by_session_token(db: AsyncSession, token: str) -> User | None:
    session = (
        await db.execute(select(UserSession).where(UserSession.token == token))
    ).scalar_one_or_none()
    if session is None:
        return None
    if session.expires_at < datetime.now(UTC):
        return None
    return (
        await db.execute(select(User).where(User.id == session.user_id))
    ).scalar_one_or_none()


async def delete_session(db: AsyncSession, token: str) -> None:
    session = (
        await db.execute(select(UserSession).where(UserSession.token == token))
    ).scalar_one_or_none()
    if session is not None:
        await db.delete(session)
        await db.commit()


async def list_users(
    db: AsyncSession, *, limit: int = 24, offset: int = 0
) -> tuple[list[User], int]:
    total = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all()), total
