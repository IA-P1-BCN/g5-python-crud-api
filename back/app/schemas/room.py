from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class RoomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Room name")
    capacity: int = Field(..., ge=1, description="Maximum number of players")
    duration: int = Field(..., gt=0, description="Duration in minutes")
    base_price: Decimal = Field(..., ge=0, decimal_places=2, description="Base price")


class RoomCreate(RoomBase):
    pass


class RoomUpdate(RoomBase):
    pass


class RoomResponse(RoomBase):
    id: int
    status: str

    model_config = ConfigDict(from_attributes=True)