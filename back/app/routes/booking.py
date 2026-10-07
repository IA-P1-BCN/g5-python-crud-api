from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from back.app.controllers import booking as booking_controller
from back.app.database import get_db
from back.app.schemas.booking import (
    BookingCreate,
    BookingDetail,
    BookingRead,
    BookingUpdate,
)

router = APIRouter()


@router.post(
    "",
    response_model=BookingRead,
    status_code=201,
    summary="Create a booking",
    description="Books a time slot for a user. The booking starts as PENDING "
    "and total_price is room.base_price x players.",
    responses={
        404: {"description": "SLOT_NOT_FOUND or USER_NOT_FOUND"},
        409: {
            "description": "USER_INACTIVE, ROOM_INACTIVE, "
            "SLOT_NOT_AVAILABLE or SLOT_TAKEN"
        },
        422: {"description": "Invalid body or INVALID_PLAYERS"},
    },
)
def create_booking_endpoint(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),  # noqa: B008
):
    return booking_controller.create_booking(db=db, booking_in=booking_in)


@router.get(
    "",
    response_model=list[BookingRead],
    summary="List bookings",
    description="Lists bookings, optionally filtered by user_id and status.",
    responses={422: {"description": "Invalid status filter"}},
)
def list_bookings_endpoint(
    user_id: int | None = None,
    status: Literal["PENDING", "CONFIRMED", "CANCELLED"] | None = None,
    db: Session = Depends(get_db),  # noqa: B008
):
    return booking_controller.list_bookings(db=db, user_id=user_id, status=status)


@router.get(
    "/{booking_id}",
    response_model=BookingDetail,
    summary="Get a booking",
    description="Returns a booking with its time slot and room.",
    responses={404: {"description": "NOT_FOUND"}},
)
def get_booking_endpoint(
    booking_id: int,
    db: Session = Depends(get_db),  # noqa: B008
):
    return booking_controller.get_booking(db=db, booking_id=booking_id)


@router.put(
    "/{booking_id}",
    response_model=BookingRead,
    summary="Modify a booking",
    description="Changes the number of players and/or moves the booking to "
    "another time slot. total_price is recalculated. Only PENDING or "
    "CONFIRMED bookings, 24h or more before the current slot starts. The new "
    "slot must be bookable and 24h or more away; the old slot becomes free.",
    responses={
        404: {"description": "NOT_FOUND or SLOT_NOT_FOUND"},
        409: {
            "description": "INVALID_TRANSITION, TOO_LATE_TO_MODIFY, "
            "ROOM_INACTIVE, SLOT_NOT_AVAILABLE or SLOT_TAKEN"
        },
        422: {"description": "Invalid body or INVALID_PLAYERS"},
    },
)
def update_booking_endpoint(
    booking_id: int,
    booking_in: BookingUpdate,
    db: Session = Depends(get_db),  # noqa: B008
):
    return booking_controller.update_booking(
        db=db, booking_id=booking_id, booking_in=booking_in
    )


@router.put(
    "/{booking_id}/cancel",
    response_model=BookingRead,
    summary="Cancel a booking",
    description="Sets the booking to CANCELLED and frees the slot. Only PENDING "
    "or CONFIRMED bookings, and only 24h or more before the slot starts.",
    responses={
        404: {"description": "NOT_FOUND"},
        409: {"description": "INVALID_TRANSITION or TOO_LATE_TO_CANCEL"},
    },
)
def cancel_booking_endpoint(
    booking_id: int,
    db: Session = Depends(get_db),  # noqa: B008
):
    return booking_controller.cancel_booking(db=db, booking_id=booking_id)


@router.put(
    "/{booking_id}/confirm",
    response_model=BookingRead,
    summary="Confirm a booking",
    description="Moves a PENDING booking to CONFIRMED.",
    responses={
        404: {"description": "NOT_FOUND"},
        409: {"description": "INVALID_TRANSITION (booking is not PENDING)"},
    },
)
def confirm_booking_endpoint(
    booking_id: int,
    db: Session = Depends(get_db),  # noqa: B008
):
    return booking_controller.confirm_booking(db=db, booking_id=booking_id)
