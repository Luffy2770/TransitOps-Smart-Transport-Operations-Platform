from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.maintenance import MaintenanceLog
from app.models.vehicle import Vehicle
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceOut
from app.core.security import get_current_user
from app.core.dependencies import RoleChecker
from app.core.enums import MaintenanceStatus, VehicleStatus

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

require_fleet_manager = Depends(RoleChecker(["Fleet Manager"]))
require_any_authenticated = Depends(get_current_user)


@router.get("", response_model=List[MaintenanceOut])
def list_maintenance(
    status: Optional[MaintenanceStatus] = None,
    db: Session = Depends(get_db),
    _current_user=require_any_authenticated,
):
    query = db.query(MaintenanceLog)
    if status:
        query = query.filter(MaintenanceLog.status == status)
    return query.all()


@router.get("/{id}", response_model=MaintenanceOut)
def get_maintenance(
    id: int,
    db: Session = Depends(get_db),
    _current_user=require_any_authenticated,
):
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance log with ID {id} not found",
        )
    return log


@router.post("", response_model=MaintenanceOut, status_code=status.HTTP_201_CREATED)
def create_maintenance(
    log_in: MaintenanceCreate,
    db: Session = Depends(get_db),
    _current_user=require_fleet_manager,
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == log_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with ID {log_in.vehicle_id} not found",
        )

    log = MaintenanceLog(**log_in.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)

    # Update vehicle status based on maintenance status
    if log.status == MaintenanceStatus.ACTIVE:
        vehicle.status = VehicleStatus.IN_SHOP
    elif log.status == MaintenanceStatus.COMPLETED:
        vehicle.status = VehicleStatus.AVAILABLE
    db.commit()

    return log


@router.patch("/{id}", response_model=MaintenanceOut)
def update_maintenance(
    id: int,
    log_in: MaintenanceUpdate,
    db: Session = Depends(get_db),
    _current_user=require_fleet_manager,
):
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance log with ID {id} not found",
        )

    update_data = log_in.model_dump(exclude_unset=True)
    old_status = log.status
    new_status = update_data.get("status")

    for field, value in update_data.items():
        setattr(log, field, value)

    # Handle vehicle status transitions based on maintenance log status
    if new_status and new_status != old_status:
        vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()
        if vehicle:
            if new_status == MaintenanceStatus.ACTIVE:
                vehicle.status = VehicleStatus.IN_SHOP
            elif new_status == MaintenanceStatus.COMPLETED:
                vehicle.status = VehicleStatus.AVAILABLE

    db.commit()
    db.refresh(log)
    return log


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance(
    id: int,
    db: Session = Depends(get_db),
    _current_user=require_fleet_manager,
):
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance log with ID {id} not found",
        )

    # Revert vehicle status if delete log was active
    if log.status == MaintenanceStatus.ACTIVE:
        vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()
        if vehicle:
            vehicle.status = VehicleStatus.AVAILABLE

    db.delete(log)
    db.commit()
    return None
