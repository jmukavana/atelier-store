#!/bin/sh
set -e

echo "Running migrations..."
alembic upgrade head

echo "Seeding catalog (idempotent, skips products that already exist)..."
python scripts/seed.py

echo "Starting server..."
exec uvicorn atelier_api.main:app --host 0.0.0.0 --port 8000
