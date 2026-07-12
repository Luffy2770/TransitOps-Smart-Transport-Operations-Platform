from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from app.database.database import get_db
from app.models.driver import Driver
from app.schemas.driver import DriverCreate, DriverUpdate, DriverOut
from app.core.security import get_current_user
from app.core.dependencies import RoleChecker
from app.core.enums import DriverStatus

router = APIRouter(prefix="/drivers", tags=["Drivers"])

# Role check dependencies
require_fleet_manager = Depends(RoleChecker(["Fleet Manager"]))
require_any_authenticated = Depends(get_current_user)

DRIVER_SORT_FIELDS = {
    "created_at": Driver.created_at,
    "updated_at": Driver.updated_at,
    "name": Driver.name,
    "status": Driver.status,
    "safety_score": Driver.safety_score,
    "license_expiry": Driver.license_expiry,
}


@router.get("", response_model=List[DriverOut])
def list_drivers(
    status: Optional[DriverStatus] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    db: Session = Depends(get_db),
    _current_user=require_any_authenticated,
):
    query = db.query(Driver)
    if status:
        query = query.filter(Driver.status == status)
    sort_col = DRIVER_SORT_FIELDS.get(sort_by, Driver.created_at)
    query = query.order_by(desc(sort_col) if sort_order == "desc" else asc(sort_col))
    return query.all()


@router.get("/{id}", response_model=DriverOut)
def get_driver(
    id: int,
    db: Session = Depends(get_db),
    _current_user=require_any_authenticated,
):
    driver = db.query(Driver).filter(Driver.id == id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver with ID {id} not found",
        )
    return driver


@router.post("", response_model=DriverOut, status_code=status.HTTP_201_CREATED)
def create_driver(
    driver_in: DriverCreate,
    db: Session = Depends(get_db),
    _current_user=require_fleet_manager,
):
    # Check for existing license number
    existing = (
        db.query(Driver)
        .filter(Driver.license_number == driver_in.license_number)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"License number '{driver_in.license_number}' is already registered",
        )

    driver = Driver(**driver_in.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.patch("/{id}", response_model=DriverOut)
def update_driver(
    id: int,
    driver_in: DriverUpdate,
    db: Session = Depends(get_db),
    _current_user=require_fleet_manager,
):
    driver = db.query(Driver).filter(Driver.id == id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver with ID {id} not found",
        )

    update_data = driver_in.model_dump(exclude_unset=True)

    if "license_number" in update_data:
        new_lic = update_data["license_number"]
        existing = (
            db.query(Driver)
            .filter(
                Driver.license_number == new_lic,
                Driver.id != id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"License number '{new_lic}' is already registered",
            )

    for field, value in update_data.items():
        setattr(driver, field, value)

    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver(
    id: int,
    db: Session = Depends(get_db),
    _current_user=require_fleet_manager,
):
    driver = db.query(Driver).filter(Driver.id == id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Driver with ID {id} not found",
        )
    db.delete(driver)
    db.commit()
    return None
