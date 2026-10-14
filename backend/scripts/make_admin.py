"""Promote an existing account to admin. Run with:
uv run python scripts/make_admin.py someone@example.com

There's no self-serve "become an admin" endpoint on purpose — that would be
an open door for any registered user to grant themselves admin access.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from sqlalchemy import select

from atelier_api.db.session import AsyncSessionLocal, engine
from atelier_api.models.user import User


async def main(email: str) -> None:
    async with AsyncSessionLocal() as session:
        user = (
            await session.execute(select(User).where(User.email == email))
        ).scalar_one_or_none()
        if user is None:
            print(f"No account found for {email}. Register the account first.")
            raise SystemExit(1)
        if user.is_admin:
            print(f"{email} is already an admin.")
        else:
            user.is_admin = True
            await session.commit()
            print(f"{email} is now an admin.")
    await engine.dispose()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: uv run python scripts/make_admin.py <email>")
        raise SystemExit(1)
    asyncio.run(main(sys.argv[1]))
