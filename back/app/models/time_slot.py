from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship

from back.app.database import Base


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    starts_at = Column(DateTime, nullable=False)
    ends_at = Column(DateTime, nullable=False)
    is_booked = Column(Boolean, default=False, nullable=False)
    is_blocked = Column(Boolean, default=False, nullable=False)

    # Relationships
    room = relationship("Room", back_populates="time_slots")
    bookings = relationship("Booking", back_populates="time_slot")

    @property
    def status(self) -> str:
        if self.is_booked:
            return "booked"
        if self.is_blocked:
            return "blocked"
        return "available"

    @status.setter
    def status(self, value: str) -> None:
        """Soporte de compatibilidad para kwargs status='available'|'booked'|'blocked'"""
        if value == "booked":
            self.is_booked = True
            self.is_blocked = False
        elif value == "blocked":
            self.is_booked = False
            self.is_blocked = True
        else:  # available
            self.is_booked = False
            self.is_blocked = False

    @property
    def is_bookable(self) -> bool:
        """BR-S5: Slot is bookable if it is neither booked nor blocked."""
        return not self.is_booked and not self.is_blocked