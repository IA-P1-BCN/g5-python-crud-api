from fastapi import Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session


class Page[T](BaseModel):
    items: list[T]
    total: int
    page: int
    size: int


class PageParams:
    # Query(ge/le) makes FastAPI answer 422 by itself: no manual check needed
    def __init__(
        self,
        page: int = Query(1, ge=1),
        size: int = Query(20, ge=1, le=100),
    ):
        self.page = page
        self.size = size


def paginate(db: Session, stmt, params: PageParams) -> dict:
    # the count must not carry the ORDER BY: useless and slower
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery()))
    rows = db.scalars(
        stmt.offset((params.page - 1) * params.size).limit(params.size)
    ).all()
    return {"items": rows, "total": total, "page": params.page, "size": params.size}
