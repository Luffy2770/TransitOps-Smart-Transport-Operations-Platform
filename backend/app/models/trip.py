from sqlalchemy import Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.core.enums import TripStatus


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True)

    source: Mapped[str] = mapped_column(String(100))

    destination: Mapped[str] = mapped_column(String(100))

    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id")
    )

    driver_id: Mapped[int] = mapped_column(
        ForeignKey("drivers.id")
    )

    cargo_weight: Mapped[float]

    planned_distance: Mapped[float]

    status: Mapped[TripStatus] = mapped_column(
        Enum(TripStatus),
        default=TripStatus.DRAFT,
    )

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")