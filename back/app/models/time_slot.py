# back/app/models/time_slot.py

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from back.app.database import Base

if TYPE_CHECKING:
    from back.app.models.booking import Booking
    from back.app.models.room import Room


class TimeSlot(Base):
    __tablename__ = "time_slots"
    __table_args__ = (
        CheckConstraint(
            "status IN ('available', 'booked', 'blocked')",
            name="ck_time_slots_status",
        ),
        CheckConstraint(
            "ends_at > starts_at",
            name="ck_time_slots_ends_after_starts",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    starts_at: Mapped[datetime] = mapped_column(nullable=False, index=True)
    ends_at: Mapped[datetime] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(default="available", nullable=False)

    room: Mapped["Room"] = relationship("Room", back_populates="time_slots")
    bookings: Mapped[list["Booking"]] = relationship(
        "Booking", back_populates="time_slot"
    )

    @property
    def is_bookable(self) -> bool:
        if self.status != "available":
            return False
        
        # Importación local diferida para evitar la importación circular
        from back.app.controllers.booking import ACTIVE_STATUSES
        return not any(b.status in ACTIVE_STATUSES for b in self.bookings)