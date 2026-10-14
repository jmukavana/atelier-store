from fastapi import APIRouter

from atelier_api.models.product import Category
from atelier_api.schemas.product import CategoryRead

router = APIRouter(prefix="/categories", tags=["categories"])

_LABELS: dict[Category, str] = {
    Category.outerwear: "Outerwear",
    Category.tailoring: "Tailoring",
    Category.knitwear: "Knitwear",
    Category.accessories: "Accessories",
}


@router.get("", response_model=list[CategoryRead])
async def list_categories() -> list[CategoryRead]:
    return [CategoryRead(value=value, label=label) for value, label in _LABELS.items()]
