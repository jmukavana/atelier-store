import stripe

from atelier_api.core.config import get_settings

settings = get_settings()

if settings.stripe_secret_key:
    stripe.api_key = settings.stripe_secret_key


def stripe_enabled() -> bool:
    return bool(settings.stripe_secret_key)
