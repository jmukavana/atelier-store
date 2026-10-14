from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, read from the environment / .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    project_name: str = "Atelier API"
    api_v1_prefix: str = "/api/v1"

    database_url: str
    """Async SQLAlchemy URL, e.g. postgresql+asyncpg://user@localhost/atelier_store"""

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    default_page_size: int = 24
    max_page_size: int = 100

    session_cookie_name: str = "atelier_session"
    session_max_age_seconds: int = 60 * 60 * 24 * 30  # 30 days, used when "remember me" is set
    cookie_secure: bool = False
    """Set true in production (HTTPS) — cookies are only httpOnly+SameSite=Lax in dev."""

    frontend_url: str = "http://localhost:3000"
    """Where Stripe redirects back to after checkout (success/cancel URLs)."""

    stripe_secret_key: str | None = None
    """Test-mode secret key (sk_test_...). When unset, checkout falls back to
    an instant "demo payment" — no Stripe involved — so the app still works
    fully without a Stripe account configured."""


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
