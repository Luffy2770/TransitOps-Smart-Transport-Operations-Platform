from datetime import date
from typing import Optional
from pydantic import BaseModel
from app.core.enums import DriverStatus


class DriverBase(BaseModel):
    name: str
    license_number: str
    license_category: str
    contact_number: str
    license_expiry: date
    safety_score: float


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    contact_number: Optional[str] = None
    license_expiry: Optional[date] = None
    safety_score: Optional[float] = None
    status: Optional[DriverStatus] = None


class DriverOut(DriverBase):
    id: int
    status: DriverStatus

    model_config = {"from_attributes": True}
