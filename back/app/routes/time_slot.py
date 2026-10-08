from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from back.app.database import get_db
from back.app.models.time_slot import TimeSlot
from back.app.schemas.time_slot import TimeSlotRead

router = APIRouter(prefix="", tags=["Time Slots"])


@router.get(
    "",
    response_model=list[TimeSlotRead],
    summary="List time slots with optional filters",
    responses={
        200: {"description": "List of time slots retrieved successfully."}
    },
)
def list_time_slots(
    room_id: int | None = Query(None, description="Filter by Room ID"),
    date: date | None = Query( # noqa: B008
        None, description="Filter by date (YYYY-MM-DD)"
    ),
    available: bool | None = Query(
        None, description="Filter only bookable slots (BR-S5)"
    ),
    db: Session = Depends(get_db),  # noqa: B008
):
    query = db.query(TimeSlot)

    if room_id is not None:
        query = query.filter(TimeSlot.room_id == room_id)

    if date is not None:
        query = query.filter(func.date(TimeSlot.starts_at) == date)

    if available is True:
        query = query.filter(
            TimeSlot.is_booked == False,
            TimeSlot.is_blocked == False,
        )

    return query.all()


@router.get(
    "/{slot_id}",
    response_model=TimeSlotRead,
    summary="Get a specific time slot by ID",
    responses={
        200: {"description": "Time slot retrieved successfully."},
        404: {"description": "Time slot not found."},
    },
)
def get_time_slot(
    slot_id: int, db: Session = Depends(get_db)  # noqa: B008
):
    slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time slot not found",
        )
    return slot

@router.delete(
    "/{slot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a time slot by ID",
)
def delete_time_slot(slot_id: int, db: Session = Depends(get_db)):  # noqa: B008
    slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time slot not found",
        )

    # Verificar si existen reservas asociadas
    if slot.bookings:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete time slot with existing bookings",
        )

    db.delete(slot)
    db.commit()
