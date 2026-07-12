from datetime import date
from pydantic import BaseModel


class FuelLogBase(BaseModel):
    vehicle_id: int
    liters: float
    cost: float
    date: date


class FuelLogCreate(FuelLogBase):
    pass


class FuelLogOut(FuelLogBase):
    id: int

    model_config = {"from_attributes": True}


class ExpenseBase(BaseModel):
    trip_id: int
    vehicle_id: int
    toll: float
    other: float


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseOut(ExpenseBase):
    id: int

    model_config = {"from_attributes": True}
