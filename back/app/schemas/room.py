from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict

class RoomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Nombre de la sala")
    capacity: int = Field(..., ge=1, description="Número máximo de jugadores")
    duration: int = Field(..., gt=0, description="Duración en minutos")
    base_price: Decimal = Field(..., ge=0, decimal_places=2, description="Precio base")

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: int
    status: str

    model_config = ConfigDict(from_attributes=True)