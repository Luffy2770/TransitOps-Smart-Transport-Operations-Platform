from sqlalchemy import Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trips.id"), nullable=False
    )
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id"), nullable=False
    )
    toll: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    other: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    trip = relationship("Trip", back_populates="expenses")