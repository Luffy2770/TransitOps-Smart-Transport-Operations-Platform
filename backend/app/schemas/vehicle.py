from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.core.enums import VehicleStatus


class VehicleBase(BaseModel):
    registration_number: str
    name: str
    type: str
    capacity_kg: float
    acquisition_cost: float
    odometer: float


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    capacity_kg: Optional[float] = None
    status: Optional[VehicleStatus] = None
    acquisition_cost: Optional[float] = None
    odometer: Optional[float] = None


class VehicleOut(VehicleBase):
    id: int
    status: VehicleStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

