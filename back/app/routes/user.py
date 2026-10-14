from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from back.app.controllers import booking as booking_controller
from back.app.controllers import user as user_controller
from back.app.core.pagination import Page, PageParams
from back.app.database import get_db
from back.app.dependencies.auth import get_current_user
from back.app.models import User
from back.app.schemas.booking import BookingDetail
from back.app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="", tags=["Users"])

SessionDep = Annotated[Session, Depends(get_db)]
UserDep = Annotated[User, Depends(get_current_user)]


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
    response_model=Page[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List users",
    description="Paginated list of users: page (default 1) and size (default 20, max 100).",
    responses={
        200: {"description": "Users retrieved successfully"},
        422: {"description": "Invalid page or size"},
    },
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
    description="My finished games (COMPLETED) with their result, most recent "
    "first. Declared before /{user_id} so 'me' is not read as an id.",
    responses={401: {"description": "Not authenticated"}},
)
def my_history_endpoint(db: SessionDep, current_user: UserDep):
    return booking_controller.list_user_history(db, current_user.id, current_user)


@router.get(
    "/{user_id}/history",
    response_model=list[BookingDetail],
    summary="Game history of a user",
    description="Finished games of a user. A client can only read their own; "
    "staff and admin can read any.",
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "FORBIDDEN: not your history"},
    },
)
def user_history_endpoint(user_id: int, db: SessionDep, current_user: UserDep):
    return booking_controller.list_user_history(db, user_id, current_user)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user profile",
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "User not found"},
    },
)
def get_user_endpoint(
    user_id: int,
    db: SessionDep,
    current_user: UserDep,
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
