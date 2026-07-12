from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.expense import Expense
from app.schemas.trip import TripCreate, TripUpdate, TripOut
from app.core.security import get_current_user
from app.core.dependencies import RoleChecker
from app.core.enums import TripStatus, VehicleStatus, DriverStatus

router = APIRouter(prefix="/trips", tags=["Trips"])

require_dispatcher_or_manager = Depends(RoleChecker(["Fleet Manager", "Dispatcher"]))
require_any_authenticated = Depends(get_current_user)


@router.get("", response_model=List[TripOut])
def list_trips(
    status: Optional[TripStatus] = None,
    db: Session = Depends(get_db),
    _current_user=require_any_authenticated,
):
    query = db.query(Trip)
    if status:
        query = query.filter(Trip.status == status)
    return query.all()


@router.get("/{id}", response_model=TripOut)
def get_trip(
    id: int,
    db: Session = Depends(get_db),
    _current_user=require_any_authenticated,
):
    trip = db.query(Trip).filter(Trip.id == id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {id} not found",
        )
    return trip


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(
    trip_in: TripCreate,
    db: Session = Depends(get_db),
    _current_user=require_dispatcher_or_manager,
):
    # Verify vehicle exists and is Available
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with ID {trip_in.vehicle_id} not found",
        )

    # Validate weight limit
    if trip_in.cargo_weight > vehicle.capacity_kg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cargo weight ({trip_in.cargo_weight} kg) exceeds vehicle carrying capacity ({vehicle.capacity_kg} kg)",
        )

    # Verify driver exists and is Available
    driver = db.query(Driver).filter(Driver.id == trip_in.driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver with ID {trip_in.driver_id} not found",
        )

    trip = Trip(**trip_in.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)

    # Add default empty expense entry for this trip
    expense = Expense(trip_id=trip.id, vehicle_id=trip.vehicle_id, toll=0.0, other=0.0)
    db.add(expense)
    db.commit()

    return trip


@router.patch("/{id}", response_model=TripOut)
def update_trip(
    id: int,
    trip_in: TripUpdate,
    db: Session = Depends(get_db),
    _current_user=require_dispatcher_or_manager,
):
    trip = db.query(Trip).filter(Trip.id == id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {id} not found",
        )

    update_data = trip_in.model_dump(exclude_unset=True)

    # Validate weight limit if cargo_weight or vehicle_id are modified
    target_vehicle_id = update_data.get("vehicle_id") or trip.vehicle_id
    target_cargo_weight = update_data.get("cargo_weight") or trip.cargo_weight
    
    vehicle = db.query(Vehicle).filter(Vehicle.id == target_vehicle_id).first()
    if vehicle and target_cargo_weight > vehicle.capacity_kg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cargo weight ({target_cargo_weight} kg) exceeds vehicle carrying capacity ({vehicle.capacity_kg} kg)",
        )

    old_status = trip.status
    new_status = update_data.get("status")

    # If dispatching
    if new_status == TripStatus.DISPATCHED and old_status != TripStatus.DISPATCHED:
        # Check vehicle status
        target_vehicle_id = update_data.get("vehicle_id") or trip.vehicle_id
        target_driver_id = update_data.get("driver_id") or trip.driver_id
        
        vehicle = db.query(Vehicle).filter(Vehicle.id == target_vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == target_driver_id).first()
        
        if vehicle and vehicle.status != VehicleStatus.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vehicle '{vehicle.registration_number}' is not available (Current Status: {vehicle.status.value})",
            )
        if driver and driver.status != DriverStatus.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Driver '{driver.name}' is not available (Current Status: {driver.status.value})",
            )
        
        if vehicle:
            vehicle.status = VehicleStatus.ON_TRIP
            if "start_odometer" not in update_data or update_data["start_odometer"] is None:
                update_data["start_odometer"] = vehicle.odometer
        if driver:
            driver.status = DriverStatus.ON_TRIP
        
        if "dispatch_time" not in update_data or update_data["dispatch_time"] is None:
            update_data["dispatch_time"] = datetime.utcnow()

    # If completing
    elif new_status == TripStatus.COMPLETED and old_status != TripStatus.COMPLETED:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

        distance = update_data.get("actual_distance") or trip.planned_distance

        if vehicle:
            vehicle.status = VehicleStatus.AVAILABLE
            vehicle.odometer += distance
            if "end_odometer" not in update_data or update_data["end_odometer"] is None:
                update_data["end_odometer"] = vehicle.odometer
        if driver:
            driver.status = DriverStatus.AVAILABLE

        if "completion_time" not in update_data or update_data["completion_time"] is None:
            update_data["completion_time"] = datetime.utcnow()

    # If cancelling
    elif new_status == TripStatus.CANCELLED and old_status != TripStatus.CANCELLED:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

        if vehicle:
            vehicle.status = VehicleStatus.AVAILABLE
        if driver:
            driver.status = DriverStatus.AVAILABLE

    for field, value in update_data.items():
        setattr(trip, field, value)

    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    id: int,
    db: Session = Depends(get_db),
    _current_user=require_dispatcher_or_manager,
):
    trip = db.query(Trip).filter(Trip.id == id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {id} not found",
        )
    
    # Restore vehicle and driver statuses if trip was active
    if trip.status == TripStatus.DISPATCHED:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
        if vehicle:
            vehicle.status = VehicleStatus.AVAILABLE
        if driver:
            driver.status = DriverStatus.AVAILABLE

    db.delete(trip)
    db.commit()
    return None
