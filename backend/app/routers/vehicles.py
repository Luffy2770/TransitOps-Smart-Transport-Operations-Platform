from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from app.database.database import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut
from app.core.security import get_current_user
from app.core.dependencies import RoleChecker
from app.core.enums import VehicleStatus

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

# Role check dependencies
require_fleet_manager = Depends(RoleChecker(["Fleet Manager"]))
require_any_authenticated = Depends(get_current_user)

VEHICLE_SORT_FIELDS = {
    "created_at": Vehicle.created_at,
    "updated_at": Vehicle.updated_at,
    "name": Vehicle.name,
    "registration_number": Vehicle.registration_number,
    "status": Vehicle.status,
    "capacity_kg": Vehicle.capacity_kg,
    "odometer": Vehicle.odometer,
    "acquisition_cost": Vehicle.acquisition_cost,
}


@router.get("", response_model=List[VehicleOut])
def list_vehicles(
    type: Optional[str] = None,
    status: Optional[VehicleStatus] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    db: Session = Depends(get_db),
    _current_user=require_any_authenticated,
):
    query = db.query(Vehicle)
    if type:
        query = query.filter(Vehicle.type == type)
    if status:
        query = query.filter(Vehicle.status == status)

    sort_col = VEHICLE_SORT_FIELDS.get(sort_by, Vehicle.created_at)
    query = query.order_by(desc(sort_col) if sort_order == "desc" else asc(sort_col))
    return query.all()


@router.get("/{id}", response_model=VehicleOut)
def get_vehicle(
    id: int,
    db: Session = Depends(get_db),
    _current_user=require_any_authenticated,
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {id} not found",
        )
    return vehicle


@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
    _current_user=require_fleet_manager,
):
    # Check for existing registration number
    existing = (
        db.query(Vehicle)
        .filter(Vehicle.registration_number == vehicle_in.registration_number)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration number '{vehicle_in.registration_number}' is already registered",
        )

    vehicle = Vehicle(**vehicle_in.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.patch("/{id}", response_model=VehicleOut)
def update_vehicle(
    id: int,
    vehicle_in: VehicleUpdate,
    db: Session = Depends(get_db),
    _current_user=require_fleet_manager,
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {id} not found",
        )

    update_data = vehicle_in.model_dump(exclude_unset=True)

    if "registration_number" in update_data:
        new_reg = update_data["registration_number"]
        existing = (
            db.query(Vehicle)
            .filter(
                Vehicle.registration_number == new_reg,
                Vehicle.id != id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration number '{new_reg}' is already registered",
            )

    for field, value in update_data.items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    id: int,
    db: Session = Depends(get_db),
    _current_user=require_fleet_manager,
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {id} not found",
        )
    db.delete(vehicle)
    db.commit()
    return None
