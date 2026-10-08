from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from back.app.controllers import user as user_controller
from back.app.database import get_db
from back.app.schemas.user import UserCreate, UserResponse, UserUpdate

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


@router.get(
    "",
    response_model=list[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List users",
)
def list_users_endpoint(
    db: SessionDep,
):
    return user_controller.list_users(db=db)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user profile",
    responses={
        404: {"description": "User not found"},
    },
)
def get_user_endpoint(
    user_id: int,
    db: SessionDep,
):
    return user_controller.get_user(db=db, user_id=user_id)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user profile",
    responses={
        404: {"description": "User not found"},
    },
)
def update_user_endpoint(
    user_id: int,
    user_in: UserUpdate,
    db: SessionDep,
):
    return user_controller.update_user(
        db=db,
        user_id=user_id,
        user_in=user_in,
    )


@router.put(
    "/{user_id}/deactivate",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Deactivate user",
    responses={
        404: {"description": "User not found"},
    },
)
def deactivate_user_endpoint(
    user_id: int,
    db: SessionDep,
):
    return user_controller.deactivate_user(
        db=db,
        user_id=user_id,
    )
