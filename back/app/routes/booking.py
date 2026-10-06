from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from back.app.controllers import booking as booking_controller
from back.app.database import get_db
from back.app.schemas.booking import BookingCreate, BookingDetail, BookingRead

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
