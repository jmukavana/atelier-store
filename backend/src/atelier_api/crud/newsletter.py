from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from atelier_api.models.newsletter import NewsletterSubscriber


async def subscribe(db: AsyncSession, email: str) -> None:
    """Idempotent subscribe — re-subscribing an existing email is a no-op."""
    statement = (
        insert(NewsletterSubscriber)
        .values(email=email)
        .on_conflict_do_nothing(index_elements=[NewsletterSubscriber.email])
    )
    await db.execute(statement)
    await db.commit()


async def list_subscribers(db: AsyncSession) -> list[NewsletterSubscriber]:
    result = await db.execute(
        select(NewsletterSubscriber).order_by(NewsletterSubscriber.created_at.desc())
    )
    return list(result.scalars().all())
