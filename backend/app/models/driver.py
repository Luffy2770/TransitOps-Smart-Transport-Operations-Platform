from datetime import date
from sqlalchemy import Date, Enum, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.core.enums import DriverStatus


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(100))

    license_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
    )

    license_category: Mapped[str] = mapped_column(String(10))

    license_expiry: Mapped[date] = mapped_column(Date)

    contact_number: Mapped[str] = mapped_column(String(20))

    safety_score: Mapped[float] = mapped_column(Float, default=100)

    status: Mapped[DriverStatus] = mapped_column(
        Enum(DriverStatus),
        default=DriverStatus.AVAILABLE,
    )

    trips = relationship("Trip", back_populates="driver")