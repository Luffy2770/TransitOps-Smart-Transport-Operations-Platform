from sqlalchemy import Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)

    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trips.id")
    )

    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id")
    )

    toll: Mapped[float] = mapped_column(Float, default=0)

    other: Mapped[float] = mapped_column(Float, default=0)