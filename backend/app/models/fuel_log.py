from datetime import date

from sqlalchemy import Date, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id: Mapped[int] = mapped_column(primary_key=True)

    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id")
    )

    liters: Mapped[float] = mapped_column(Float)

    cost: Mapped[float] = mapped_column(Float)

    date: Mapped[date] = mapped_column(Date)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")