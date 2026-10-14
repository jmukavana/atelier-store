import uuid

from pydantic import BaseModel, ConfigDict, Field

from atelier_api.models.product import Category

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class ProductCreate(BaseModel):
    slug: str = Field(min_length=1, max_length=200, pattern=SLUG_PATTERN)
    name: str = Field(min_length=1, max_length=200)
    category: Category
    price: int = Field(gt=0)
    compare_at_price: int | None = Field(default=None, gt=0)
    description: str = Field(min_length=1)
    details: list[str] = Field(default_factory=list)
    sizes: list[str] = Field(min_length=1)
    mark: str = Field(min_length=1, max_length=4)
    is_new: bool = False


class ProductUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=200, pattern=SLUG_PATTERN)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: Category | None = None
    price: int | None = Field(default=None, gt=0)
    compare_at_price: int | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, min_length=1)
    details: list[str] | None = None
    sizes: list[str] | None = Field(default=None, min_length=1)
    mark: str | None = Field(default=None, min_length=1, max_length=4)
    is_new: bool | None = None


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name: str
    category: Category
    price: int
    compare_at_price: int | None
    description: str
    details: list[str]
    sizes: list[str]
    mark: str
    is_new: bool


class ProductList(BaseModel):
    items: list[ProductRead]
    total: int
    limit: int
    offset: int


class CategoryRead(BaseModel):
    value: Category
    label: str
