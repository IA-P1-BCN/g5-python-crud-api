from datetime import date as date_type
from datetime import datetime, time
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session, joinedload

from back.app.core.errors import AppError
from back.app.database import get_db
from back.app.models.time_slot import TimeSlot
from back.app.schemas.time_slot import (
    TimeSlotCreate,
    TimeSlotRead,
    TimeSlotUpdate,
)

router = APIRouter(prefix="", tags=["Time Slots"])

# Definición de un alias para inyección de dependencias limpia
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[TimeSlotRead])
def list_time_slots(
    db: DbSession,
    room_id: Annotated[int | None, Query(description="Filter by Room ID")] = None,
    date: Annotated[date_type | None, Query(description="Filter by date (YYYY-MM-DD)")] = None,
    available: Annotated[bool | None, Query(description="Filter only bookable slots (BR-S5)")] = None,
):
    """List time slots with optional filters for room_id, date, and availability."""
    query = db.query(TimeSlot).options(joinedload(TimeSlot.bookings))

    if room_id is not None:
        query = query.filter(TimeSlot.room_id == room_id)

    if date is not None:
        start_day = datetime.combine(date, time.min)
        end_day = datetime.combine(date, time.max)
        query = query.filter(
            TimeSlot.starts_at >= start_day, TimeSlot.starts_at <= end_day
        )

    slots = query.all()

    if available:
        slots = [s for s in slots if s.is_bookable]

    return slots


@router.get("/{slot_id}", response_model=TimeSlotRead)
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


@router.post("", response_model=TimeSlotRead, status_code=status.HTTP_201_CREATED)
def create_time_slot(slot_in: TimeSlotCreate, db: DbSession):
    """Create a new time slot."""
    slot = TimeSlot(
        room_id=slot_in.room_id,
        starts_at=slot_in.starts_at,
        ends_at=slot_in.ends_at,
        status="available",
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.put("/{slot_id}", response_model=TimeSlotRead)
def update_time_slot(slot_id: int, slot_in: TimeSlotUpdate, db: DbSession):
    """Update an existing time slot."""
    slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not slot:
        raise AppError(
            "Time slot not found",
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
        )

    update_data = slot_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(slot, field, value)

    db.commit()
    db.refresh(slot)
    return slot


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_slot(slot_id: int, db: DbSession):
    """Delete a time slot (BR-S6: blocks deletion only if active bookings exist)."""
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

    active_statuses = {"CONFIRMED", "PENDING"}
    has_active_bookings = any(
        getattr(b, "status", None) in active_statuses for b in slot.bookings
    )

    if has_active_bookings:
        raise AppError(
            "Cannot delete time slot with active bookings",
            status_code=status.HTTP_409_CONFLICT,
            code="SLOT_OVERLAP",
        )

    db.delete(slot)
    db.commit()
