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

ADMIN_ERRORS = {
    401: {"description": "UNAUTHORIZED: missing or invalid token"},
    403: {"description": "FORBIDDEN: role not allowed (admin only)"},
}


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user (admin)",
    responses={
        **ADMIN_ERRORS,
        409: {"description": "DUPLICATE: email already exists"},
        422: {"description": "Invalid body"},
    },
    dependencies=[Depends(require_role("admin"))],
)
def create_user_endpoint(user_in: UserCreate, db: SessionDep):
    return user_controller.create_user(db=db, user_in=user_in)


@router.get(
    "",
    response_model=Page[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List users (admin)",
    description="Paginated list of users: page (default 1) and size (default 20, max 100).",
    responses={
        **ADMIN_ERRORS,
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
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get my profile",
    responses={
        401: {"description": "Not authenticated"},
    },
)
def get_my_profile_endpoint(current_user: UserDep):
    return user_controller.get_my_profile(current_user)


@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update my profile",
    description=(
        "Users can update their own name and phone, "
        "but not their email, role, or active status."
    ),
    responses={
        401: {"description": "Not authenticated"},
        422: {"description": "Invalid body"},
    },
)
def update_my_profile_endpoint(
    user_in: UserUpdate,
    db: SessionDep,
    current_user: UserDep,
):
    return user_controller.update_user(
        db=db,
        user_id=current_user.id,
        user_in=user_in,
    )


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
    summary="Get user profile (admin)",
    responses={
        **ADMIN_ERRORS,
        404: {"description": "User not found"},
    },
    dependencies=[Depends(require_role("admin"))],
)
def get_user_endpoint(user_id: int, db: SessionDep):
    return user_controller.get_user(db=db, user_id=user_id)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user profile (admin)",
    responses={
        **ADMIN_ERRORS,
        404: {"description": "User not found"},
        422: {"description": "Invalid body"},
    },
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
    summary="Change user role (admin)",
    description="Only an admin can change a user's role (BR-A4).",
    responses={
        **ADMIN_ERRORS,
        404: {"description": "User not found"},
        422: {"description": "Invalid role"},
    },
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
    summary="Deactivate user (admin)",
    responses={
        **ADMIN_ERRORS,
        404: {"description": "User not found"},
    },
    dependencies=[Depends(require_role("admin"))],
)
def deactivate_user_endpoint(user_id: int, db: SessionDep):
    return user_controller.deactivate_user(
        db=db,
        user_id=user_id,
    )
