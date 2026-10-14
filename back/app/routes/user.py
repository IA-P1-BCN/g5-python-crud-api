from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from back.app.controllers import booking as booking_controller
from back.app.controllers import user as user_controller
from back.app.core.pagination import Page, PageParams
from back.app.database import get_db
from back.app.dependencies.auth import get_current_user, require_role
from back.app.models import User
from back.app.schemas.booking import BookingDetail
from back.app.schemas.user import (
    UserCreate,
    UserResponse,
    UserRoleUpdate,
    UserUpdate,
)

router = APIRouter(prefix="", tags=["Users"])

SessionDep = Annotated[Session, Depends(get_db)]
UserDep = Annotated[User, Depends(get_current_user)]


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin"))],
)
def create_user_endpoint(user_in: UserCreate, db: SessionDep):
    return user_controller.create_user(db=db, user_in=user_in)


@router.get(
    "",
    response_model=Page[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List users",
    description="Paginated list of users: page (default 1) and size (default 20, max 100).",
    responses={
        200: {"description": "Users retrieved successfully"},
        422: {"description": "Invalid page or size"},
    },
    dependencies=[Depends(require_role("admin"))],
)
def list_users_endpoint(
    db: SessionDep,
    params: Annotated[PageParams, Depends()],
):
    return user_controller.list_users(db=db, params=params)


@router.get(
    "/me/history",
    response_model=list[BookingDetail],
    summary="My game history",
)
def my_history_endpoint(db: SessionDep, current_user: UserDep):
    return booking_controller.list_user_history(db, current_user.id, current_user)


@router.get(
    "/{user_id}/history",
    response_model=list[BookingDetail],
    summary="Game history of a user",
)
def user_history_endpoint(
    user_id: int,
    db: SessionDep,
    current_user: UserDep,
):
    return booking_controller.list_user_history(db, user_id, current_user)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user profile",
    dependencies=[Depends(require_role("admin"))],
)
def get_user_endpoint(user_id: int, db: SessionDep):
    return user_controller.get_user(db=db, user_id=user_id)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user profile",
    dependencies=[Depends(require_role("admin"))],
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
    "/{user_id}/role",
    response_model=UserResponse,
    summary="Change user role",
    dependencies=[Depends(require_role("admin"))],
)
def update_user_role_endpoint(
    user_id: int,
    role_in: UserRoleUpdate,
    db: SessionDep,
):
    return user_controller.update_user_role(
        db=db,
        user_id=user_id,
        role_in=role_in,
    )


@router.put(
    "/{user_id}/deactivate",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Deactivate user",
    dependencies=[Depends(require_role("admin"))],
)
def deactivate_user_endpoint(user_id: int, db: SessionDep):
    return user_controller.deactivate_user(
        db=db,
        user_id=user_id,
    )