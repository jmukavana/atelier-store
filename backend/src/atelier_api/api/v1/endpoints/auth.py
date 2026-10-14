from fastapi import APIRouter, Request, Response, status

from atelier_api.api.deps import CurrentUser, DbSession
from atelier_api.core.config import get_settings
from atelier_api.crud import user as crud_user
from atelier_api.models.session import UserSession
from atelier_api.schemas.user import UserCreate, UserLogin, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _set_session_cookie(response: Response, session: UserSession, remember_me: bool) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session.token,
        # Omitting max_age makes it a browser-session cookie (cleared on
        # browser close) when the user didn't ask to stay signed in — the
        # row in `user_sessions` still expires the same either way, this
        # only controls how long the *browser* holds onto the cookie.
        max_age=settings.session_max_age_seconds if remember_me else None,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, response: Response, db: DbSession) -> UserRead:
    user = await crud_user.create_user(db, payload)
    session = await crud_user.create_session(db, user)
    _set_session_cookie(response, session, payload.remember_me)
    return UserRead.model_validate(user)


@router.post("/login", response_model=UserRead)
async def login(payload: UserLogin, response: Response, db: DbSession) -> UserRead:
    user = await crud_user.authenticate(db, payload.email, payload.password)
    session = await crud_user.create_session(db, user)
    _set_session_cookie(response, session, payload.remember_me)
    return UserRead.model_validate(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response, db: DbSession) -> None:
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        await crud_user.delete_session(db, token)
    response.delete_cookie(settings.session_cookie_name, path="/")


@router.get("/me", response_model=UserRead)
async def me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)
