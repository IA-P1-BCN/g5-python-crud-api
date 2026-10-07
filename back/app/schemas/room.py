from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class RoomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Nome della stanza")
    capacity: int = Field(..., ge=1, description="Numero massimo di giocatori")
    duration: int = Field(..., gt=0, description="Durata in minuti")
    base_price: Decimal = Field(..., ge=0, decimal_places=2, description="Prezzo base")


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Nome della stanza")
    capacity: Optional[int] = Field(None, ge=1, description="Numero massimo di giocatori")
    duration: Optional[int] = Field(None, gt=0, description="Durata in minuti")
    base_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2, description="Prezzo base")


class RoomResponse(RoomBase):
    id: int
    status: str

    model_config = ConfigDict(from_attributes=True)