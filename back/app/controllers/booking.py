from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from back.app.core.errors import AppError
from back.app.models import Booking, TimeSlot, User
from back.app.schemas.booking import BookingCreate

ACTIVE_STATUSES = ("PENDING", "CONFIRMED", "IN_PROGRESS")


def create_booking(db: Session, booking_in: BookingCreate) -> Booking:
    slot = db.get(TimeSlot, booking_in.time_slot_id)
    if slot is None:
        raise AppError("Time slot not found", code="SLOT_NOT_FOUND", status_code=404)

    user = db.get(User, booking_in.user_id)
    if user is None:
        raise AppError("User not found", code="USER_NOT_FOUND", status_code=404)

    if not user.is_active:
        raise AppError("User is inactive", code="USER_INACTIVE", status_code=409)

    if slot.room.status != "active":
        raise AppError("Room is inactive", code="ROOM_INACTIVE", status_code=409)

    if slot.status != "available":
        raise AppError(
            "Time slot is not available", code="SLOT_NOT_AVAILABLE", status_code=409
        )

    already_booked = db.execute(
        select(Booking.id).where(
            Booking.time_slot_id == slot.id,
            Booking.status.in_(ACTIVE_STATUSES),
        )
    ).first()
    if already_booked:
        raise AppError(
            "Time slot is already booked", code="SLOT_TAKEN", status_code=409
        )

    if booking_in.players > slot.room.capacity:
        raise AppError(
            f"Players exceed room capacity ({slot.room.capacity})",
            code="INVALID_PLAYERS",
            status_code=422,
        )

    booking = Booking(
        user_id=user.id,
        time_slot_id=slot.id,
        players=booking_in.players,
        total_price=slot.room.base_price * booking_in.players,
        status="PENDING",
    )
    db.add(booking)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(
            "Time slot is already booked", code="SLOT_TAKEN", status_code=409
        )
    db.refresh(booking)
    return booking
