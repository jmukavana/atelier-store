"""Seed the products table. Run with: uv run python scripts/seed.py"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from seed_data import SEED_PRODUCTS
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from atelier_api.db.session import AsyncSessionLocal, engine
from atelier_api.models.product import Product


async def seed(session: AsyncSession) -> None:
    existing = set((await session.execute(select(Product.slug))).scalars().all())
    new_products = [
        Product(**data) for data in SEED_PRODUCTS if data["slug"] not in existing
    ]
    if not new_products:
        print("Nothing to seed — all products already exist.")
        return

    session.add_all(new_products)
    await session.commit()
    print(f"Seeded {len(new_products)} product(s).")


async def main() -> None:
    async with AsyncSessionLocal() as session:
        await seed(session)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
