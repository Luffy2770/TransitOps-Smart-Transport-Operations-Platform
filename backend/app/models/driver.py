from datetime import date
from sqlalchemy import Date, Enum, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.core.enums import DriverStatus
from app.models.mixins import TimestampMixin


class Driver(TimestampMixin, Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    license_number: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    license_category: Mapped[str] = mapped_column(String(10), nullable=False)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=False)
    license_expiry: Mapped[date] = mapped_column(Date, nullable=False)
    safety_score: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    status: Mapped[DriverStatus] = mapped_column(
        Enum(DriverStatus),
        default=DriverStatus.AVAILABLE,
        nullable=False,
    )

    trips = relationship("Trip", back_populates="driver")