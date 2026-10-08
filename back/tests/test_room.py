from decimal import Decimal

from pydantic import BaseModel, Field, model_validator


class RoomBase(BaseModel):
    name: str
    capacity: int = Field(gt=0)
    duration: int = Field(gt=0)
    base_price: Decimal = Field(ge=0)
    status: str = Field(default="active")
    
    # Nuevos campos del catálogo (Ticket 056 / #105)
    slug: str
    genre: str
    min_players: int = Field(ge=1)
    difficulty: int = Field(ge=1, le=5)
    hook: str
    story: str
    audience: str

    @model_validator(mode="after")
    def validate_business_rules(self):
        # BR-R1: min_players entre 1 y capacity
        if not (1 <= self.min_players <= self.capacity):
            raise ValueError("BR-R1: min_players must be between 1 and capacity.")
        # BR-R2: difficulty entre 1 y 5
        if not (1 <= self.difficulty <= 5):
            raise ValueError("BR-R2: difficulty must be between 1 and 5.")
        return self


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    name: str | None = None
    capacity: int | None = None
    duration: int | None = None
    base_price: Decimal | None = None
    status: str | None = None
    slug: str | None = None
    genre: str | None = None
    min_players: int | None = None
    difficulty: int | None = None
    hook: str | None = None
    story: str | None = None
    audience: str | None = None

    @model_validator(mode="after")
    def validate_update_rules(self):
        if self.difficulty is not None and not (1 <= self.difficulty <= 5):
            raise ValueError("BR-R2: difficulty must be between 1 and 5.")
        return self


class RoomResponse(RoomBase):
    id: int

    class Config:
        from_attributes = True