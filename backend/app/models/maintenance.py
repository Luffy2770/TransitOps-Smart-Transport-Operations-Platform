from datetime import date

from sqlalchemy import Date, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.core.enums import MaintenanceStatus


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id: Mapped[int] = mapped_column(primary_key=True)

    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id")
    )

    service_type: Mapped[str] = mapped_column(String(100))

    cost: Mapped[float] = mapped_column(Float)

    service_date: Mapped[date] = mapped_column(Date)

    status: Mapped[MaintenanceStatus] = mapped_column(
        Enum(MaintenanceStatus),
        default=MaintenanceStatus.ACTIVE,
    )

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")