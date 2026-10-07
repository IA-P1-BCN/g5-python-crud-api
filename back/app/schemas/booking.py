from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


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


class BookingUpdate(BaseModel):
    """Data the client sends to modify a booking (BR-B7, BR-L5)."""

    players: int | None = Field(default=None, ge=1)
    time_slot_id: int | None = None

    @model_validator(mode="after")
    def at_least_one_field(self):
        if self.players is None and self.time_slot_id is None:
            raise ValueError("Provide players, time_slot_id or both")
        return self
