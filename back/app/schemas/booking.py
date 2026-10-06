from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class BookingCreate(BaseModel):
    """Data the client sends to create a booking."""

    user_id: int
    time_slot_id: int
    players: int = Field(ge=1)


class BookingRead(BaseModel):
    """Data the API returns for a booking."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    time_slot_id: int
    players: int
    total_price: Decimal
    status: str
    created_at: datetime


class SlotInfo(BaseModel):
    """Time slot info shown inside a booking detail."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    starts_at: datetime
    ends_at: datetime
    status: str


class RoomInfo(BaseModel):
    """Room info shown inside a booking detail."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    capacity: int
    base_price: Decimal


class BookingDetail(BookingRead):
    """Booking with its slot and room, returned by GET /bookings/{id}."""

    time_slot: SlotInfo
    room: RoomInfo
