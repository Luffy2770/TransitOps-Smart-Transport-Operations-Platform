from datetime import datetime
from typing import Optional
from sqlalchemy import Enum, Float, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.core.enums import TripStatus


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trip_code: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id"), nullable=False
    )
    driver_id: Mapped[int] = mapped_column(
        ForeignKey("drivers.id"), nullable=False
    )
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    destination: Mapped[str] = mapped_column(String(100), nullable=False)
    cargo_weight: Mapped[float] = mapped_column(Float, nullable=False)
    planned_distance: Mapped[float] = mapped_column(Float, nullable=False)
    actual_distance: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )
    dispatch_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    completion_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    start_odometer: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )
    end_odometer: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fuel_used: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    revenue: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[TripStatus] = mapped_column(
        Enum(TripStatus),
        default=TripStatus.DRAFT,
        nullable=False,
    )

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    expenses = relationship("Expense", back_populates="trip")