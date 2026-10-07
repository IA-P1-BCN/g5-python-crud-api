from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from back.app.controllers import user as user_controller
from back.app.database import get_db
from back.app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="", tags=["Users"])

SessionDep = Annotated[Session, Depends(get_db)]


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user_endpoint(
    user_in: UserCreate,
    db: SessionDep,
):
    return user_controller.create_user(db=db, user_in=user_in)
