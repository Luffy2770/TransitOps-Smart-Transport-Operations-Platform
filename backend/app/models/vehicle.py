from datetime import datetime
from sqlalchemy import DateTime, Enum, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.core.enums import VehicleStatus


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)

    registration_number: Mapped[str] = mapped_column(
        String(20), unique=True, index=True
    )

    name: Mapped[str] = mapped_column(String(100))

    type: Mapped[str] = mapped_column(String(50))

    capacity_kg: Mapped[float] = mapped_column(Float)

    odometer: Mapped[float] = mapped_column(Float, default=0)

    acquisition_cost: Mapped[float] = mapped_column(Float)

    status: Mapped[VehicleStatus] = mapped_column(
        Enum(VehicleStatus),
        default=VehicleStatus.AVAILABLE,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")