from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.core.enums import TripStatus


class TripBase(BaseModel):
    trip_code: str
    vehicle_id: int
    driver_id: int
    source: str
    destination: str
    cargo_weight: float
    planned_distance: float
    revenue: float


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    trip_code: Optional[str] = None
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    source: Optional[str] = None
    destination: Optional[str] = None
    cargo_weight: Optional[float] = None
    planned_distance: Optional[float] = None
    actual_distance: Optional[float] = None
    dispatch_time: Optional[datetime] = None
    completion_time: Optional[datetime] = None
    start_odometer: Optional[float] = None
    end_odometer: Optional[float] = None
    fuel_used: Optional[float] = None
    revenue: Optional[float] = None
    status: Optional[TripStatus] = None


class TripOut(TripBase):
    id: int
    actual_distance: Optional[float] = None
    dispatch_time: Optional[datetime] = None
    completion_time: Optional[datetime] = None
    start_odometer: Optional[float] = None
    end_odometer: Optional[float] = None
    fuel_used: Optional[float] = None
    status: TripStatus

    model_config = {"from_attributes": True}
