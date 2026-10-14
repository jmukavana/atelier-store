import enum
import uuid
from datetime import datetime

from sqlalchemy import ARRAY, Boolean, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from atelier_api.db.base import Base


class Category(str, enum.Enum):
    outerwear = "outerwear"
    tailoring = "tailoring"
    knitwear = "knitwear"
    accessories = "accessories"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[Category] = mapped_column(
        Enum(Category, name="category", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        index=True,
    )
    # Whole-dollar amounts (matches the storefront's zero-decimal display),
    # not cents.
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    compare_at_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    sizes: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    mark: Mapped[str] = mapped_column(String, nullable=False)
    is_new: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
