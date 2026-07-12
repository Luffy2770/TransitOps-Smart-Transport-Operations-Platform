from datetime import date, datetime, timedelta
import random

from app.database.base import Base
from app.database.database import engine, SessionLocal
from app.core.security import hash_password
from app.core.enums import RoleType, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus

# Import all models to ensure they are registered on Base
from app.models.role import Role
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.maintenance import MaintenanceLog
from app.models.fuel_log import FuelLog
from app.models.expense import Expense


def seed_database():
    print("Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)

    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding Roles...")
        roles = {}
        for role_name in RoleType:
            role = Role(name=role_name.value)
            db.add(role)
            roles[role_name.value] = role
        db.commit()

        # Refresh roles to get IDs
        for name in roles:
            db.refresh(roles[name])

        print("Seeding Users...")
        admin_user = User(
            name="System Administrator",
            email="admin@transitops.com",
            password_hash=hash_password("admin123"),
            role_id=roles[RoleType.FLEET_MANAGER.value].id,
        )
        dispatcher_user = User(
            name="Jane Dispatcher",
            email="dispatcher@transitops.com",
            password_hash=hash_password("dispatcher123"),
            role_id=roles[RoleType.DISPATCHER.value].id,
        )
        safety_user = User(
            name="Sam Safety",
            email="safety@transitops.com",
            password_hash=hash_password("safety123"),
            role_id=roles[RoleType.SAFETY_OFFICER.value].id,
        )
        financial_user = User(
            name="Fiona Finance",
            email="finance@transitops.com",
            password_hash=hash_password("finance123"),
            role_id=roles[RoleType.FINANCIAL_ANALYST.value].id,
        )
        db.add_all([admin_user, dispatcher_user, safety_user, financial_user])
        db.commit()

        print("Seeding Vehicles...")
        vehicles_data = [
            ("V-101", "Van-01", "Van", 8000.0, VehicleStatus.AVAILABLE, 45000.0, 15200.0),
            ("V-102", "Truck-02", "Truck", 12000.0, VehicleStatus.ON_TRIP, 60000.0, 24800.0),
            ("V-103", "Mini-03", "Mini", 5000.0, VehicleStatus.AVAILABLE, 32000.0, 8900.0),
            ("V-104", "Truck-04", "Truck", 15000.0, VehicleStatus.IN_SHOP, 75000.0, 42100.0),
            ("V-105", "Van-05", "Van", 10000.0, VehicleStatus.AVAILABLE, 55000.0, 18500.0),
        ]
        vehicles = []
        for reg, name, v_type, cap, status, cost, odo in vehicles_data:
            vehicle = Vehicle(
                registration_number=reg,
                name=name,
                type=v_type,
                capacity_kg=cap,
                status=status,
                acquisition_cost=cost,
                odometer=odo,
            )
            db.add(vehicle)
            vehicles.append(vehicle)
        db.commit()

        # Refresh vehicles to get IDs
        for v in vehicles:
            db.refresh(v)

        print("Seeding Drivers...")
        drivers_data = [
            ("Michael Schumacher", "LIC-MS987", "HMV", "+919876543210", date.today() + timedelta(days=365), 98.5, DriverStatus.AVAILABLE),
            ("Lewis Hamilton", "LIC-LH441", "HMV", "+919876543211", date.today() + timedelta(days=200), 96.0, DriverStatus.ON_TRIP),
            ("Max Verstappen", "LIC-MV033", "LMV", "+919876543212", date.today() + timedelta(days=500), 94.2, DriverStatus.AVAILABLE),
            ("Sebastian Vettel", "LIC-SV005", "HMV", "+919876543213", date.today() - timedelta(days=10), 85.0, DriverStatus.SUSPENDED),
            ("Fernando Alonso", "LIC-FA014", "LMV", "+919876543214", date.today() + timedelta(days=400), 97.8, DriverStatus.OFF_DUTY),
        ]
        drivers = []
        for name, lic_no, cat, contact, expiry, safety, status in drivers_data:
            driver = Driver(
                name=name,
                license_number=lic_no,
                license_category=cat,
                contact_number=contact,
                license_expiry=expiry,
                safety_score=safety,
                status=status,
            )
            db.add(driver)
            drivers.append(driver)
        db.commit()

        # Refresh drivers
        for d in drivers:
            db.refresh(d)

        print("Seeding Fuel Logs...")
        # Add some historical fuel logs for vehicles
        fuel_logs = []
        for vehicle in vehicles:
            # Generate 3 fuel logs for each vehicle
            for i in range(3):
                fuel_date = date.today() - timedelta(days=(i * 7) + 3)
                liters = random.uniform(50.0, 150.0)
                cost = liters * random.uniform(1.2, 1.5)
                log = FuelLog(
                    vehicle_id=vehicle.id,
                    liters=round(liters, 2),
                    cost=round(cost, 2),
                    date=fuel_date,
                )
                db.add(log)
                fuel_logs.append(log)
        db.commit()

        print("Seeding Maintenance Logs...")
        # Add some maintenance logs
        maintenance_logs = [
            MaintenanceLog(
                vehicle_id=vehicles[0].id,
                service_type="Routine Oil Change",
                cost=120.0,
                service_date=date.today() - timedelta(days=30),
                status=MaintenanceStatus.COMPLETED,
            ),
            MaintenanceLog(
                vehicle_id=vehicles[3].id,
                service_type="Transmission Repair",
                cost=1500.0,
                service_date=date.today() - timedelta(days=2),
                status=MaintenanceStatus.ACTIVE,
            ),
            MaintenanceLog(
                vehicle_id=vehicles[1].id,
                service_type="Brake Pad Replacement",
                cost=350.0,
                service_date=date.today() - timedelta(days=15),
                status=MaintenanceStatus.COMPLETED,
            ),
        ]
        db.add_all(maintenance_logs)
        db.commit()

        print("Seeding Trips and Expenses...")
        # Completed Trip
        completed_trip = Trip(
            trip_code="TRIP-001",
            vehicle_id=vehicles[0].id,
            driver_id=drivers[0].id,
            source="Mumbai",
            destination="Pune",
            cargo_weight=5000.0,
            planned_distance=150.0,
            actual_distance=152.5,
            dispatch_time=datetime.utcnow() - timedelta(days=5, hours=6),
            completion_time=datetime.utcnow() - timedelta(days=5, hours=2),
            start_odometer=15047.5,
            end_odometer=15200.0,
            fuel_used=25.0,
            revenue=4500.0,
            status=TripStatus.COMPLETED,
        )
        db.add(completed_trip)
        db.commit()
        db.refresh(completed_trip)

        completed_expense = Expense(
            trip_id=completed_trip.id,
            vehicle_id=vehicles[0].id,
            toll=240.0,
            other=50.0,
        )
        db.add(completed_expense)

        # On Trip
        ongoing_trip = Trip(
            trip_code="TRIP-002",
            vehicle_id=vehicles[1].id,
            driver_id=drivers[1].id,
            source="Delhi",
            destination="Jaipur",
            cargo_weight=10000.0,
            planned_distance=270.0,
            dispatch_time=datetime.utcnow() - timedelta(hours=3),
            start_odometer=24530.0,
            revenue=8000.0,
            status=TripStatus.DISPATCHED,
        )
        db.add(ongoing_trip)
        db.commit()
        db.refresh(ongoing_trip)

        ongoing_expense = Expense(
            trip_id=ongoing_trip.id,
            vehicle_id=vehicles[1].id,
            toll=400.0,
            other=0.0,
        )
        db.add(ongoing_expense)

        # Draft Trip
        draft_trip = Trip(
            trip_code="TRIP-003",
            vehicle_id=vehicles[2].id,
            driver_id=drivers[2].id,
            source="Bangalore",
            destination="Chennai",
            cargo_weight=4000.0,
            planned_distance=350.0,
            revenue=9500.0,
            status=TripStatus.DRAFT,
        )
        db.add(draft_trip)
        db.commit()

        print("Database seeded successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
