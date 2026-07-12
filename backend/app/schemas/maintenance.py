from datetime import date
from typing import Optional
from pydantic import BaseModel
from app.core.enums import MaintenanceStatus


class MaintenanceBase(BaseModel):
    vehicle_id: int
    service_type: str
    cost: float
    service_date: date


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    service_type: Optional[str] = None
    cost: Optional[float] = None
    service_date: Optional[date] = None
    status: Optional[MaintenanceStatus] = None


class MaintenanceOut(MaintenanceBase):
    id: int
    status: MaintenanceStatus

    model_config = {"from_attributes": True}
