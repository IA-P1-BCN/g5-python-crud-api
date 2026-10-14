from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from back.app.controllers import room as room_controller
from back.app.core.pagination import Page, PageParams
from back.app.database import get_db
from back.app.dependencies.auth import require_role
from back.app.schemas.room import (
    RoomCreate,
    RoomResponse,
    RoomUpdate,
    TimeSlotBulkGenerateRequest,
    TimeSlotBulkGenerateResponse,
)

router = APIRouter(prefix="", tags=["Rooms"])

ADMIN_ERRORS = {
    401: {"description": "UNAUTHORIZED: missing or invalid token"},
    403: {"description": "FORBIDDEN: role not allowed (admin only)"},
}

SessionDep = Annotated[Session, Depends(get_db)]


@router.post(
    "",
    response_model=RoomResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a room",
    dependencies=[Depends(require_role("admin"))],
    responses={
        **ADMIN_ERRORS,
        409: {"description": "Room name or slug already exists."},
    },
)
def create_room_endpoint(room_in: RoomCreate, db: SessionDep):
    return room_controller.create_room(db=db, room_in=room_in)


@router.put(
    "/{room_id}",
    response_model=RoomResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a room",
    dependencies=[Depends(require_role("admin"))],
    responses={
        **ADMIN_ERRORS,
        404: {"description": "Room not found."},
        409: {"description": "Room name or slug already exists."},
    },
)
def update_room_endpoint(room_id: int, room_in: RoomUpdate, db: SessionDep):
    return room_controller.update_room(db=db, room_id=room_id, room_in=room_in)


@router.put(
    "/{room_id}/deactivate",
    response_model=RoomResponse,
    status_code=status.HTTP_200_OK,
    summary="Deactivate a room",
    dependencies=[Depends(require_role("admin"))],
    responses={
        **ADMIN_ERRORS,
        409: {"description": "Room has future active bookings."},
    },
)
def deactivate_room_endpoint(room_id: int, db: SessionDep):
    return room_controller.deactivate_room(db=db, room_id=room_id)


@router.get(
    "",
    response_model=Page[RoomResponse],
    status_code=status.HTTP_200_OK,
    summary="List rooms",
    description="Paginated list of rooms: page (default 1) and size (default 20, max 100). "
    "Optional filter: status.",
    responses={422: {"description": "Invalid page or size"}},
)
def list_rooms_endpoint(
    db: SessionDep,
    params: Annotated[PageParams, Depends()],
    status: str | None = None,
):
    return room_controller.list_rooms(db=db, params=params, status=status)


@router.get(
    "/{room_id_or_slug}",
    response_model=RoomResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a room by ID or slug",
    responses={404: {"description": "Room not found."}},
)
def get_room_endpoint(room_id_or_slug: str, db: SessionDep):
    return room_controller.get_room_by_id_or_slug(
        db=db,
        room_id_or_slug=room_id_or_slug,
    )


@router.put(
    "/{room_id}/activate",
    response_model=RoomResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate a room",
    dependencies=[Depends(require_role("admin"))],
    responses={
        **ADMIN_ERRORS,
        200: {
            "description": "Room successfully activated or already active (idempotent)."
        },
        404: {"description": "Room not found."},
    },
)
def activate_room_endpoint(room_id: int, db: SessionDep):
    return room_controller.activate_room(db=db, room_id=room_id)


@router.post(
    "/{room_id}/time-slots/generate",
    response_model=TimeSlotBulkGenerateResponse,
    status_code=status.HTTP_200_OK,
    summary="Bulk generate time slots for a room",
    description="Creates available slots between date_from and date_to, spaced "
    "by the room duration plus a 30 min reset buffer (BR-S7). Past slots "
    "(BR-S2) and overlaps (BR-S3) are skipped. The range cannot span more "
    "than 90 days (BR-S8).",
    responses={
        401: {"description": "Missing or invalid token."},
        403: {"description": "FORBIDDEN: the caller is not an admin."},
        404: {"description": "Room not found."},
        409: {"description": "ROOM_INACTIVE: the room is not active."},
        422: {"description": "VALIDATION_ERROR: invalid date or time range."},
    },
    dependencies=[Depends(require_role("admin"))],
)
def bulk_generate_time_slots_endpoint(
    room_id: int, payload: TimeSlotBulkGenerateRequest, db: SessionDep
):
    return room_controller.bulk_generate_time_slots(
        db=db, room_id=room_id, payload=payload
    )


@router.put("/{room_id}/price", summary="Quick price change")
def change_price_endpoint(room_id: int, new_price: float, db: SessionDep):
    x = room_controller.get_room_by_id_or_slug(db=db, room_id_or_slug=str(room_id))
    x.base_price = new_price
    db.commit()
    return {"id": x.id, "base_price": new_price, "changed_at": "now"}
