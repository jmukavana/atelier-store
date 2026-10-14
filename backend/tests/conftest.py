import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

TEST_DB_NAME = "atelier_store_test"
MAINTENANCE_URL = "postgresql://jamlech@localhost:5432/postgres"
TEST_DATABASE_URL = f"postgresql+asyncpg://jamlech@localhost:5432/{TEST_DB_NAME}"

# Must be set before importing app modules, since Settings reads it at
# import time via get_settings().
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

import asyncpg
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from atelier_api.api.deps import get_db
from atelier_api.db.base import Base
from atelier_api.main import app
from atelier_api.models.product import Product
from atelier_api.models.user import User


@pytest_asyncio.fixture(scope="session")
async def engine():
    conn = await asyncpg.connect(MAINTENANCE_URL)
    try:
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", TEST_DB_NAME
        )
        if not exists:
            await conn.execute(f'CREATE DATABASE "{TEST_DB_NAME}"')
    finally:
        await conn.close()

    test_engine = create_async_engine(TEST_DATABASE_URL)
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)

    yield test_engine
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    async with engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            await connection.execute(table.delete())


@pytest_asyncio.fixture
async def client(engine, db_session):
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def another_client(client):
    """A second, independent cookie jar — simulates a different browser /
    signed-in-as-someone-else session against the same running app+db."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_client(client, db_session):
    """A `client` that is signed in as an admin. There's no API to grant
    admin — mirrors `scripts/make_admin.py`, which flips the DB flag
    directly — so the test does the same."""
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@example.com",
            "password": "correct-horse-battery",
            "first_name": "Admin",
            "last_name": "User",
        },
    )
    await db_session.execute(
        update(User).where(User.email == "admin@example.com").values(is_admin=True)
    )
    await db_session.commit()
    return client


@pytest_asyncio.fixture
async def sample_product(db_session) -> Product:
    product = Product(
        slug="test-wool-overcoat",
        name="Test Wool Overcoat",
        category="outerwear",
        price=890,
        description="A test product.",
        details=["Detail one"],
        sizes=["44", "46"],
        mark="O",
        is_new=True,
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    return product
