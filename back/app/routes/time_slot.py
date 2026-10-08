from datetime import UTC, datetime, timedelta
from datetime import date as date_type
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from back.app.controllers import time_slot as controller
from back.app.core.errors import AppError
from back.app.database import get_db
from back.app.models.time_slot import TimeSlot
from back.app.schemas.time_slot import (
    TimeSlotCreate,
    TimeSlotRead,
    TimeSlotResponse,
    TimeSlotUpdate,
)

router = APIRouter(prefix="/api/v1/time-slots", tags=["time-slots"])

SessionDep = Annotated[Session, Depends(get_db)]


@router.get(
    "/",
    response_model=list[TimeSlotRead],
    summary="List time slots",
    responses={200: {"description": "Time slots, optionally filtered."}},
)
def list_time_slots(
    db: SessionDep,
    room_id: Annotated[int | None, Query(description="Filter by room")] = None,
    date: Annotated[date_type | None, Query(description="Filter by day (UTC)")] = None,
    available: Annotated[bool | None, Query(description="Only bookable slots (BR-S5)")] = None,
):
    stmt = select(TimeSlot).options(selectinload(TimeSlot.bookings))
    if room_id is not None:
        stmt = stmt.where(TimeSlot.room_id == room_id)
    if date is not None:
        day_start = datetime(date.year, date.month, date.day, tzinfo=UTC)
        stmt = stmt.where(
            TimeSlot.starts_at >= day_start,
            TimeSlot.starts_at < day_start + timedelta(days=1),
        )
    slots = db.scalars(stmt.order_by(TimeSlot.starts_at)).all()
    # ponytail: filtered in Python; move to SQL when pagination lands (tickets 048/049)
    if available:
        slots = [s for s in slots if s.is_bookable]
    return slots


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
    responses={409: {"description": "Room inactive or slot overlap."}},
)
def create_time_slot(slot_in: TimeSlotCreate, db: SessionDep):
    return controller.create_time_slot_controller(slot_in, db)


@router.put(
    "/{slot_id}",
    response_model=TimeSlotResponse,
    summary="Update a time slot",
    responses={409: {"description": "Active booking or slot overlap."}},
)
def update_time_slot(slot_id: int, slot_in: TimeSlotUpdate, db: SessionDep):
    return controller.update_time_slot_controller(slot_id, slot_in, db)


@router.delete(
    "/{slot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a time slot",
    responses={409: {"description": "Slot has an active booking."}},
)
def delete_time_slot(slot_id: int, db: SessionDep):
    return controller.delete_time_slot_controller(slot_id, db)
