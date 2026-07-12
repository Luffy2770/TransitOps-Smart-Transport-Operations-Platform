from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.maintenance import MaintenanceLog
from app.models.fuel_log import FuelLog
from app.models.expense import Expense
from app.core.security import get_current_user
from app.core.enums import TripStatus, VehicleStatus, DriverStatus

router = APIRouter(prefix="/analytics", tags=["Analytics"])

require_any_authenticated = Depends(get_current_user)


@router.get("/kpis")
def get_kpis(
    db: Session = Depends(get_db),
    _current_user=require_any_authenticated,
):
    # Total distance (sum of actual_distance of completed trips)
    total_distance_res = (
        db.query(func.sum(Trip.actual_distance))
        .filter(Trip.status == TripStatus.COMPLETED)
        .scalar()
    )
    total_distance = float(total_distance_res or 0)

    # Total active vehicles (not retired)
    total_active_vehicles = (
        db.query(Vehicle)
        .filter(Vehicle.status != VehicleStatus.RETIRED)
        .count()
    )

    # Total drivers on trip
    drivers_on_trip = (
        db.query(Driver)
        .filter(Driver.status == DriverStatus.ON_TRIP)
        .count()
    )

    # Total revenue from completed trips
    total_revenue_res = (
        db.query(func.sum(Trip.revenue))
        .filter(Trip.status == TripStatus.COMPLETED)
        .scalar()
    )
    total_revenue = float(total_revenue_res or 0)

    # Costs components
    total_fuel_cost = float(db.query(func.sum(FuelLog.cost)).scalar() or 0)
    total_maint_cost = float(db.query(func.sum(MaintenanceLog.cost)).scalar() or 0)
    
    total_trip_tolls = float(db.query(func.sum(Expense.toll)).scalar() or 0)
    total_trip_other = float(db.query(func.sum(Expense.other)).scalar() or 0)
    
    total_costs = total_fuel_cost + total_maint_cost + total_trip_tolls + total_trip_other

    # Average safety score of active/available drivers
    avg_safety_score_res = (
        db.query(func.avg(Driver.safety_score))
        .filter(Driver.status != DriverStatus.SUSPENDED)
        .scalar()
    )
    avg_safety_score = float(avg_safety_score_res or 0)

    return {
        "total_distance": round(total_distance, 1),
        "total_active_vehicles": total_active_vehicles,
        "drivers_on_trip": drivers_on_trip,
        "total_revenue": round(total_revenue, 2),
        "total_costs": round(total_costs, 2),
        "avg_safety_score": round(avg_safety_score, 1),
    }


@router.get("/roi")
def get_roi_analysis(
    db: Session = Depends(get_db),
    _current_user=require_any_authenticated,
):
    vehicles = db.query(Vehicle).all()
    roi_data = []

    for v in vehicles:
        # Sum of maintenance
        maint_cost = float(
            db.query(func.sum(MaintenanceLog.cost))
            .filter(MaintenanceLog.vehicle_id == v.id)
            .scalar()
            or 0
        )

        # Sum of fuel
        fuel_cost = float(
            db.query(func.sum(FuelLog.cost))
            .filter(FuelLog.vehicle_id == v.id)
            .scalar()
            or 0
        )

        # Sum of completed trip revenues for this vehicle
        revenue = float(
            db.query(func.sum(Trip.revenue))
            .filter(Trip.vehicle_id == v.id, Trip.status == TripStatus.COMPLETED)
            .scalar()
            or 0
        )

        # Calculate ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
        roi = 0.0
        if v.acquisition_cost > 0:
            roi = (revenue - (maint_cost + fuel_cost)) / v.acquisition_cost

        roi_data.append(
            {
                "vehicle_id": v.id,
                "registration_number": v.registration_number,
                "name": v.name,
                "acquisition_cost": v.acquisition_cost,
                "total_revenue": round(revenue, 2),
                "total_maintenance_cost": round(maint_cost, 2),
                "total_fuel_cost": round(fuel_cost, 2),
                "roi_percentage": round(roi * 100, 2),
            }
        )

    return roi_data
