from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.fuel_log import FuelLog
from app.models.expense import Expense
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.schemas.fuel_expense import FuelLogCreate, FuelLogOut, ExpenseCreate, ExpenseOut
from app.core.security import get_current_user
from app.core.dependencies import RoleChecker

router = APIRouter(tags=["Fuel & Expenses"])

require_fleet_manager = Depends(RoleChecker(["Fleet Manager"]))
require_any_authenticated = Depends(get_current_user)


# Fuel Log Routes
@router.get("/fuel-logs", response_model=List[FuelLogOut])
def list_fuel_logs(
    vehicle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _current_user=require_any_authenticated,
):
    query = db.query(FuelLog)
    if vehicle_id:
        query = query.filter(FuelLog.vehicle_id == vehicle_id)
    return query.all()


@router.post("/fuel-logs", response_model=FuelLogOut, status_code=status.HTTP_201_CREATED)
def create_fuel_log(
    log_in: FuelLogCreate,
    db: Session = Depends(get_db),
    _current_user=require_fleet_manager,
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == log_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with ID {log_in.vehicle_id} not found",
        )

    log = FuelLog(**log_in.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# Expense Routes
@router.get("/expenses", response_model=List[ExpenseOut])
def list_expenses(
    trip_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _current_user=require_any_authenticated,
):
    query = db.query(Expense)
    if trip_id:
        query = query.filter(Expense.trip_id == trip_id)
    return query.all()


@router.post("/expenses", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
    _current_user=require_fleet_manager,
):
    trip = db.query(Trip).filter(Trip.id == expense_in.trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trip with ID {expense_in.trip_id} not found",
        )

    # Check if expense already exists for this trip
    existing = db.query(Expense).filter(Expense.trip_id == expense_in.trip_id).first()
    if existing:
        # Update existing
        existing.toll = expense_in.toll
        existing.other = expense_in.other
        db.commit()
        db.refresh(existing)
        return existing

    # Create new
    expense = Expense(**expense_in.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense
