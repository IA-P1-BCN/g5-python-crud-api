from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from back.app.controllers import booking as booking_controller
from back.app.database import get_db
from back.app.schemas.booking import BookingCreate, BookingRead

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
