from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from back.app.database import Base


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    starts_at = Column(DateTime(timezone=True), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="available", nullable=False)

    room = relationship("Room", back_populates="time_slots")
    bookings = relationship("Booking", back_populates="time_slot")

    @property
    def is_bookable(self) -> bool:
        """BR-S5: A time slot is bookable if status is 'available' and has no active bookings."""
        if self.status != "available":
            return False
        active_statuses = {"CONFIRMED", "PENDING"}
        return not any(
            getattr(b, "status", None) in active_statuses
            for b in self.bookings
        )