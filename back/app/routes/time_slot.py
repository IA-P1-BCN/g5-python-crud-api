from datetime import UTC, datetime
from datetime import date as date_type
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session, joinedload

from back.app.controllers.booking import ACTIVE_STATUSES
from back.app.controllers.time_slot import (
    create_time_slot_controller,
    update_time_slot_controller,
)
from back.app.core.errors import AppError
from back.app.database import get_db
from back.app.models.time_slot import TimeSlot
from back.app.schemas.time_slot import (
    TimeSlotCreate,
    TimeSlotRead,
    TimeSlotUpdate,
)

router = APIRouter(prefix="", tags=["Time Slots"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get(
    "",
    response_model=list[TimeSlotRead],
    summary="List time slots",
    description="Retrieve a list of time slots with optional filtering by room, date, and availability.",
    responses={
        200: {"description": "List of time slots retrieved successfully."},
    },
)
def list_time_slots(
    db: DbSession,
    room_id: Annotated[int | None, Query(description="Filter by Room ID")] = None,
    date: Annotated[
        date_type | None, Query(description="Filter by date (YYYY-MM-DD)")
    ] = None,
    available: Annotated[
        bool | None, Query(description="Filter only bookable slots (BR-S5)")
    ] = None,
):
    """List time slots with optional filters for room_id, date, and availability."""
    query = db.query(TimeSlot).options(joinedload(TimeSlot.bookings))

    if room_id is not None:
        query = query.filter(TimeSlot.room_id == room_id)

    if date is not None:
        start_day = datetime(date.year, date.month, date.day, tzinfo=UTC)
        end_day = datetime(date.year, date.month, date.day, 23, 59, 59, 999999, tzinfo=UTC)
        query = query.filter(
            TimeSlot.starts_at >= start_day,
            TimeSlot.starts_at <= end_day,
        )

    slots = query.all()

    if available:
        slots = [s for s in slots if s.is_bookable]

    return slots


@router.get(
    "/{slot_id}",
    response_model=TimeSlotRead,
    summary="Get time slot by ID",
    description="Retrieve details of a specific time slot.",
    responses={
        200: {"description": "Time slot retrieved successfully."},
        404: {"description": "Time slot not found."},
    },
)
def get_time_slot(slot_id: int, db: DbSession):
    """Retrieve a single time slot by ID."""
    slot = (
        db.query(TimeSlot)
        .options(joinedload(TimeSlot.bookings))
        .filter(TimeSlot.id == slot_id)
        .first()
    )
    if not slot:
        raise AppError(
            "Time slot not found",
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
        )
    return slot


@router.post(
    "",
    response_model=TimeSlotRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a time slot",
    description="Create a new time slot executing business validations (BR-S1, BR-S2, BR-S3).",
    responses={
        201: {"description": "Time slot created successfully."},
        400: {"description": "Invalid payload or date parameters."},
        409: {"description": "Overlap or inactive room restriction."},
    },
)
def create_time_slot(slot_in: TimeSlotCreate, db: DbSession):
    """Create a new time slot delegating logic to controller."""
    return create_time_slot_controller(slot_in, db)


@router.put(
    "/{slot_id}",
    response_model=TimeSlotRead,
    summary="Update a time slot",
    description="Update an existing time slot executing business validations.",
    responses={
        200: {"description": "Time slot updated successfully."},
        404: {"description": "Time slot not found."},
        409: {"description": "Active bookings prevent modifications."},
    },
)
def update_time_slot(slot_id: int, slot_in: TimeSlotUpdate, db: DbSession):
    """Update an existing time slot delegating logic to controller."""
    return update_time_slot_controller(slot_id, slot_in, db)


@router.delete(
    "/{slot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a time slot",
    description="Delete a time slot (BR-S6: blocks deletion only if active bookings exist).",
    responses={
        204: {"description": "Time slot deleted successfully."},
        404: {"description": "Time slot not found."},
        409: {"description": "Active bookings present (SLOT_OVERLAP)."},
    },
)
def delete_time_slot(slot_id: int, db: DbSession):
    """Delete a time slot blocking operation if active bookings exist."""
    slot = (
        db.query(TimeSlot)
        .options(joinedload(TimeSlot.bookings))
        .filter(TimeSlot.id == slot_id)
        .first()
    )
    if not slot:
        raise AppError(
            "Time slot not found",
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
        )

    has_active_bookings = any(
        getattr(b, "status", None) in ACTIVE_STATUSES for b in slot.bookings
    )

    if has_active_bookings:
        raise AppError(
            "Cannot delete time slot with active bookings",
            status_code=status.HTTP_409_CONFLICT,
            code="SLOT_OVERLAP",
        )

    db.delete(slot)
    db.commit()
