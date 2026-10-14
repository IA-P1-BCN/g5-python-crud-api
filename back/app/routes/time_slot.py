from datetime import UTC, datetime, timedelta
from datetime import date as date_type
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from back.app.controllers import time_slot as controller
from back.app.core.errors import AppError
from back.app.core.pagination import Page, PageParams, paginate
from back.app.database import get_db
from back.app.dependencies.auth import require_role
from back.app.models.booking import ACTIVE_STATUSES, Booking
from back.app.models.time_slot import TimeSlot
from back.app.schemas.time_slot import (
    PublicRoomBoardResponse,
    TimeSlotCreate,
    TimeSlotRead,
    TimeSlotResponse,
    TimeSlotUpdate,
)

router = APIRouter(prefix="/api/v1/time-slots")

ADMIN_ERRORS = {
    401: {"description": "UNAUTHORIZED: missing or invalid token"},
    403: {"description": "FORBIDDEN: role not allowed (admin only)"},
}

SessionDep = Annotated[Session, Depends(get_db)]

TimeSlotsResponse = Page[TimeSlotRead] | PublicRoomBoardResponse


@router.get(
    "/",
    response_model=TimeSlotsResponse,
    summary="List time slots or the public day board",
    description="Paginated list of time slots (page default 1, size default 20, "
    "max 100), earliest first.",
    responses={
        200: {
            "description": (
                "Paginated time slots, or the public day board (not paginated) "
                "when only `date` is given (active rooms with their slots, BR-R6)."
            )
        },
        422: {"description": "Invalid filter, page or size"},
    },
)
def list_time_slots(
    db: SessionDep,
    params: Annotated[PageParams, Depends()],
    room_id: Annotated[int | None, Query(description="Filter by room")] = None,
    date: Annotated[date_type | None, Query(description="Filter by day (UTC)")] = None,
    available: Annotated[
        bool | None, Query(description="Only bookable slots (BR-S5)")
    ] = None,
):
    if room_id is None and available is None and date is not None:
        return controller.get_day_board(db, date)

    stmt = select(TimeSlot).options(selectinload(TimeSlot.bookings))
    if room_id is not None:
        stmt = stmt.where(TimeSlot.room_id == room_id)
    if date is not None:
        day_start = datetime(date.year, date.month, date.day, tzinfo=UTC)
        stmt = stmt.where(
            TimeSlot.starts_at >= day_start,
            TimeSlot.starts_at < day_start + timedelta(days=1),
        )
    if available:
        # same rule as TimeSlot.is_bookable (BR-S5), in SQL so `total` is exact
        has_active_booking = select(Booking.id).where(
            Booking.time_slot_id == TimeSlot.id,
            Booking.status.in_(ACTIVE_STATUSES),
        )
        stmt = stmt.where(TimeSlot.status == "available", ~has_active_booking.exists())
    return paginate(db, stmt.order_by(TimeSlot.starts_at, TimeSlot.id), params)


@router.get(
    "/{slot_id}",
    response_model=TimeSlotRead,
    summary="Get a time slot",
    responses={404: {"description": "Time slot not found."}},
)
def get_time_slot(slot_id: int, db: SessionDep):
    slot = db.get(TimeSlot, slot_id)
    if slot is None:
        raise AppError(message="Time slot not found", code="NOT_FOUND", status_code=404)
    return slot


@router.post(
    "/",
    response_model=TimeSlotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a time slot",
    dependencies=[Depends(require_role("admin"))],
    responses={**ADMIN_ERRORS, 409: {"description": "Room inactive or slot overlap."}},
)
def create_time_slot(slot_in: TimeSlotCreate, db: SessionDep):
    return controller.create_time_slot_controller(slot_in, db)


@router.put(
    "/{slot_id}",
    response_model=TimeSlotResponse,
    summary="Update a time slot",
    dependencies=[Depends(require_role("admin"))],
    responses={**ADMIN_ERRORS, 409: {"description": "Active booking or slot overlap."}},
)
def update_time_slot(slot_id: int, slot_in: TimeSlotUpdate, db: SessionDep):
    return controller.update_time_slot_controller(slot_id, slot_in, db)


@router.delete(
    "/{slot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a time slot",
    dependencies=[Depends(require_role("admin"))],
    responses={**ADMIN_ERRORS, 409: {"description": "Slot has an active booking."}},
)
def delete_time_slot(slot_id: int, db: SessionDep):
    return controller.delete_time_slot_controller(slot_id, db)
