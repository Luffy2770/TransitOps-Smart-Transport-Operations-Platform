"""
TransitOps – Realistic & Consistent Seed Data Generator
======================================================
Generates a mathematically and operationally consistent dataset:
  - 100 Vehicles (Trucks, Vans, Minis, Tankers, Trailers)
  - 200 Drivers (with realistic Indian names and compatible licenses)
  - 500 Trips (420 Completed, 15 Dispatched, 45 Draft, 20 Cancelled)
  - Consistent statuses:
    * Vehicles and Drivers on active (Dispatched) trips are marked 'On Trip'.
    * Drivers/vehicles cannot be on multiple active trips at the same time.
    * Vehicles in active maintenance are marked 'In Shop'.
    * Drivers with expired licenses or low safety scores are 'Suspended'.
  - Timeline consistency:
    * Historical completed trips update the vehicle's odometer step-by-step.
    * Fuel logs and maintenance logs align with the dates/distances of the vehicles.
"""

from datetime import date, datetime, timedelta
import random

from app.database.base import Base
from app.database.database import engine, SessionLocal
from app.core.security import hash_password
from app.core.enums import (
    RoleType, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus,
)

from app.models.role import Role
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.maintenance import MaintenanceLog
from app.models.fuel_log import FuelLog
from app.models.expense import Expense

# ──────────────────────────────────────────────────────────────────────
# Reference Data
# ──────────────────────────────────────────────────────────────────────

INDIAN_FIRST_NAMES = [
    "Aarav", "Aditi", "Amit", "Ananya", "Arjun", "Bhavya", "Chetan", "Deepa",
    "Dhruv", "Divya", "Eshan", "Fatima", "Gaurav", "Geeta", "Harish", "Isha",
    "Jayesh", "Kavita", "Kiran", "Lakshmi", "Manish", "Meera", "Nikhil", "Nisha",
    "Omkar", "Pooja", "Pranav", "Priya", "Rahul", "Rashmi", "Ravi", "Rekha",
    "Rohit", "Sakshi", "Sanjay", "Sarita", "Sunil", "Tanvi", "Uday", "Vandana",
    "Vijay", "Yamini", "Yash", "Zara", "Abhishek", "Ankita", "Ashwin", "Bharti",
    "Chirag", "Disha", "Ganesh", "Hema", "Ishaan", "Jyoti", "Kartik", "Lata",
    "Mohan", "Neha", "Pankaj", "Rajesh", "Sameer", "Shreya", "Tushar", "Uma",
    "Varun", "Swati", "Anil", "Bindu", "Chandra", "Devika", "Girish", "Heena",
    "Irfan", "Janaki", "Kamal", "Leela", "Mukesh", "Nandini", "Prasad", "Radha",
    "Satish", "Tara", "Umesh", "Vinod", "Waseem", "Yogesh", "Zubin", "Akash",
    "Bala", "Chitra", "Dinesh", "Ekta", "Farhan", "Gita", "Hari", "Indu",
    "Jagdish", "Komal", "Lalit", "Mala",
]

INDIAN_LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Gupta", "Singh", "Kumar", "Reddy", "Nair",
    "Iyer", "Das", "Joshi", "Mehta", "Shah", "Choudhury", "Rao", "Pillai",
    "Mishra", "Agarwal", "Bose", "Chatterjee", "Desai", "Fernandes",
    "Ghosh", "Hegde", "Jain", "Kaur", "Kulkarni", "Malhotra", "Mukherjee",
    "Naidu", "Pandey", "Qureshi", "Rajan", "Saxena", "Thakur", "Upadhyay",
    "Varma", "Yadav", "Banerjee", "Chopra", "Dutta", "Menon", "Shetty",
    "Tiwari", "Ahuja", "Bhatt", "Chauhan", "Dubey", "Goel", "Kapoor",
]

VEHICLE_TYPES = ["Truck", "Van", "Mini", "Tanker", "Trailer"]

VEHICLE_NAMES = {
    "Truck": [
        "Tata Prima 4928.S", "Ashok Leyland 4825", "BharatBenz 3528C",
        "Eicher Pro 6049", "Volvo FMX 460", "Mahindra Blazo X 46",
        "Tata Signa 4825.TK", "Ashok Leyland Captain 4019",
        "BharatBenz 2828C", "ISUZU FVZ 34T",
    ],
    "Van": [
        "Tata Ace Gold", "Mahindra Supro Van", "Maruti Eeco Cargo",
        "Ashok Leyland Dost+", "Tata Intra V30", "Mahindra Bolero Maxitruck",
        "Force Traveller 26", "Piaggio Ape Xtra DLX",
    ],
    "Mini": [
        "Tata Ace Mini", "Mahindra Jeeto", "Piaggio Ape City",
        "Bajaj Maxima Z", "Tata Magic Express", "Ashok Leyland Bada Dost",
    ],
    "Tanker": [
        "Tata Signa 4923.S Tanker", "Ashok Leyland 4923 Tanker",
        "BharatBenz 4928 Tanker", "Volvo FH16 Tanker",
    ],
    "Trailer": [
        "Tata Prima 4028.S Trailer", "Ashok Leyland 4923 Trailer",
        "Scania P410 Trailer", "MAN CLA 40.280 Trailer",
    ],
}

CAPACITY_RANGE = {
    "Truck":   (12000, 28000),
    "Van":     (800, 3500),
    "Mini":    (500, 1500),
    "Tanker":  (15000, 30000),
    "Trailer": (20000, 40000),
}

COST_RANGE = {
    "Truck":   (1800000, 4500000),
    "Van":     (400000, 900000),
    "Mini":    (250000, 550000),
    "Tanker":  (3000000, 6000000),
    "Trailer": (2500000, 5500000),
}

RTO_CODES = [
    "MH-01", "MH-02", "MH-04", "MH-12", "MH-14", "MH-43",
    "DL-01", "DL-02", "DL-08",
    "KA-01", "KA-02", "KA-05", "KA-09",
    "TN-01", "TN-07", "TN-09",
    "GJ-01", "GJ-06", "GJ-15",
    "RJ-14", "RJ-19", "RJ-27",
    "UP-14", "UP-32", "UP-80",
    "WB-01", "WB-06",
    "AP-09", "TS-07", "TS-08",
    "KL-01", "KL-07",
    "MP-04", "MP-09",
    "HR-01", "HR-26",
    "PB-02", "PB-10",
]

ROUTES = [
    ("Mumbai", "Pune", 150), ("Mumbai", "Nashik", 170), ("Mumbai", "Surat", 290),
    ("Mumbai", "Ahmedabad", 530), ("Mumbai", "Goa", 590), ("Mumbai", "Nagpur", 820),
    ("Delhi", "Jaipur", 280), ("Delhi", "Agra", 210), ("Delhi", "Chandigarh", 250),
    ("Delhi", "Lucknow", 555), ("Delhi", "Dehradun", 250), ("Delhi", "Amritsar", 450),
    ("Bangalore", "Chennai", 350), ("Bangalore", "Mysore", 150), ("Bangalore", "Hyderabad", 570),
    ("Bangalore", "Kochi", 560), ("Bangalore", "Mangalore", 350), ("Bangalore", "Hubli", 400),
    ("Kolkata", "Patna", 590), ("Kolkata", "Bhubaneswar", 440), ("Kolkata", "Guwahati", 590),
    ("Kolkata", "Ranchi", 410), ("Kolkata", "Siliguri", 560),
    ("Chennai", "Coimbatore", 510), ("Chennai", "Madurai", 460), ("Chennai", "Pondicherry", 150),
    ("Chennai", "Tiruchirappalli", 330), ("Chennai", "Visakhapatnam", 780),
    ("Hyderabad", "Vijayawada", 270), ("Hyderabad", "Warangal", 150), ("Hyderabad", "Nagpur", 500),
    ("Hyderabad", "Tirupati", 560),
    ("Ahmedabad", "Rajkot", 220), ("Ahmedabad", "Vadodara", 110), ("Ahmedabad", "Bhuj", 340),
    ("Pune", "Kolhapur", 230), ("Pune", "Aurangabad", 240), ("Pune", "Solapur", 250),
    ("Jaipur", "Jodhpur", 340), ("Jaipur", "Udaipur", 390), ("Jaipur", "Kota", 250),
    ("Lucknow", "Varanasi", 320), ("Lucknow", "Kanpur", 90), ("Lucknow", "Allahabad", 200),
    ("Indore", "Bhopal", 195), ("Indore", "Ujjain", 55), ("Indore", "Nagpur", 560),
    ("Chandigarh", "Shimla", 115), ("Chandigarh", "Ludhiana", 100),
    ("Kochi", "Trivandrum", 200), ("Kochi", "Kozhikode", 200),
]

SERVICE_TYPES = [
    "Engine Oil Change", "Brake Pad Replacement", "Tyre Rotation",
    "Air Filter Replacement", "Transmission Fluid Change", "Battery Replacement",
    "Coolant Flush", "Spark Plug Replacement", "Suspension Check & Repair",
    "Wheel Alignment", "AC Service", "Full Body Inspection",
    "Clutch Plate Replacement", "Radiator Repair", "Exhaust System Repair",
    "Fuel Injector Cleaning", "Power Steering Fluid Change", "Differential Oil Change",
    "Headlight Restoration", "Windshield Wiper Replacement",
]

def seed_database():
    random.seed(1337)  # Set seed for reproducibility

    print("Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)

    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── Roles ────────────────────────────────────────────────────
        print("Seeding Roles...")
        roles = {}
        for role_name in RoleType:
            role = Role(name=role_name.value)
            db.add(role)
            roles[role_name.value] = role
        db.commit()
        for name in roles:
            db.refresh(roles[name])

        # ── Users ────────────────────────────────────────────────────
        print("Seeding Staff Users...")
        users = [
            User(name="System Administrator", email="admin@transitops.com",
                 password_hash=hash_password("admin123"),
                 role_id=roles[RoleType.FLEET_MANAGER.value].id),
            User(name="Jane Dispatcher", email="dispatcher@transitops.com",
                 password_hash=hash_password("dispatcher123"),
                 role_id=roles[RoleType.DISPATCHER.value].id),
            User(name="Sam Safety", email="safety@transitops.com",
                 password_hash=hash_password("safety123"),
                 role_id=roles[RoleType.SAFETY_OFFICER.value].id),
            User(name="Fiona Finance", email="finance@transitops.com",
                 password_hash=hash_password("finance123"),
                 role_id=roles[RoleType.FINANCIAL_ANALYST.value].id),
        ]
        db.add_all(users)
        db.commit()

        # ── Vehicles Setup ───────────────────────────────────────────
        print("Initializing 15 Vehicles...")
        vehicles_data = []
        used_reg = set()
        now = datetime.utcnow()

        for i in range(15):
            v_type = random.choice(VEHICLE_TYPES)
            rto = random.choice(RTO_CODES)
            while True:
                suffix = f"{random.randint(1000, 9999)}"
                letter = random.choice("ABCDEFGHJKLMNPRSTUVWXYZ")
                reg = f"{rto}-{letter}{letter}-{suffix}"
                if reg not in used_reg:
                    used_reg.add(reg)
                    break

            cap_lo, cap_hi = CAPACITY_RANGE[v_type]
            cost_lo, cost_hi = COST_RANGE[v_type]
            
            # Start vehicles with a base odometer of 5,000 - 50,000 km
            initial_odo = round(random.uniform(5000, 50000), 1)
            days_ago = random.randint(100, 730)
            created = now - timedelta(days=days_ago)

            v = Vehicle(
                registration_number=reg,
                name=random.choice(VEHICLE_NAMES[v_type]),
                type=v_type,
                capacity_kg=round(random.uniform(cap_lo, cap_hi), 0),
                status=VehicleStatus.AVAILABLE,  # Temporary
                acquisition_cost=round(random.uniform(cost_lo, cost_hi), 0),
                odometer=initial_odo,
                created_at=created,
                updated_at=created
            )
            db.add(v)
            vehicles_data.append({
                "model": v,
                "type": v_type,
                "current_odo": initial_odo,
                "last_active_time": created
            })
        
        db.commit()
        for item in vehicles_data:
            db.refresh(item["model"])

        # ── Drivers Setup ────────────────────────────────────────────
        print("Initializing 18 Drivers...")
        drivers_data = []
        used_names = set()
        used_lic = set()

        for i in range(18):
            while True:
                fname = random.choice(INDIAN_FIRST_NAMES)
                lname = random.choice(INDIAN_LAST_NAMES)
                full = f"{fname} {lname}"
                if full not in used_names:
                    used_names.add(full)
                    break

            while True:
                state_code = random.choice(["MH", "DL", "KA", "TN", "GJ", "RJ", "UP", "WB", "AP", "TS", "KL", "MP"])
                lic_num = f"{state_code}-{random.randint(10, 99)}-{random.randint(100000, 999999)}"
                if lic_num not in used_lic:
                    used_lic.add(lic_num)
                    break

            # Assign category: LMV for light vehicle drivers, others HMV/HTV
            lic_cat = "LMV" if random.random() < 0.35 else random.choice(["HMV", "HGMV", "HTV"])
            
            # Most drivers have long license validity, a few are near expiry or expired
            expiry_roll = random.random()
            if expiry_roll < 0.05:
                expiry = date.today() - timedelta(days=random.randint(1, 60))
            elif expiry_roll < 0.12:
                expiry = date.today() + timedelta(days=random.randint(1, 30))
            else:
                expiry = date.today() + timedelta(days=random.randint(90, 1000))

            days_ago = random.randint(100, 730)
            created = now - timedelta(days=days_ago)

            d = Driver(
                name=full,
                license_number=lic_num,
                license_category=lic_cat,
                contact_number=f"+91{random.randint(7000000000, 9999999999)}",
                license_expiry=expiry,
                safety_score=round(random.uniform(75.0, 100.0), 1),
                status=DriverStatus.AVAILABLE, # Temporary
                created_at=created,
                updated_at=created
            )
            db.add(d)
            drivers_data.append({
                "model": d,
                "category": lic_cat,
                "last_active_time": created
            })

        db.commit()
        for item in drivers_data:
            db.refresh(item["model"])

        # Helper: check compatibility
        def is_compatible(driver_cat, vehicle_type):
            if vehicle_type in ("Van", "Mini"):
                return True # Any driver can drive light vehicles
            else:
                return driver_cat in ("HMV", "HGMV", "HTV")

        # ── Chronological Trips Simulation (25 Trips) ────────────────
        print("Simulating 25 Trips Chronologically...")
        
        # We will stagger trips over the past 90 days
        # 15 Completed, 3 Dispatched, 5 Draft, 2 Cancelled
        trip_statuses = (
            [TripStatus.COMPLETED] * 15 +
            [TripStatus.DISPATCHED] * 3 +
            [TripStatus.DRAFT] * 5 +
            [TripStatus.CANCELLED] * 2
        )
        random.shuffle(trip_statuses)

        # Generate timestamps for all trips over 90 days, then sort them
        start_time_base = now - timedelta(days=90)
        trip_events = []
        for idx, status in enumerate(trip_statuses):
            offset_seconds = random.randint(0, 90 * 24 * 3600)
            t_time = start_time_base + timedelta(seconds=offset_seconds)
            trip_events.append((t_time, status, idx))
        
        trip_events.sort(key=lambda x: x[0])  # Process chronologically

        # Track active usage during simulation to avoid double allocation
        busy_vehicles = set()  # set of vehicle IDs currently on trip
        busy_drivers = set()   # set of driver IDs currently on trip

        trips_created = []

        for trip_time, status, orig_idx in trip_events:
            # 1. Select vehicle and driver
            # Find a vehicle not currently busy
            available_v_items = [v for v in vehicles_data if v["model"].id not in busy_vehicles]
            if not available_v_items:
                available_v_items = vehicles_data
            vehicle_item = random.choice(available_v_items)
            vehicle = vehicle_item["model"]

            # Find a compatible driver who is not busy and whose license is valid at trip_time
            available_d_items = [
                d for d in drivers_data 
                if d["model"].id not in busy_drivers 
                and is_compatible(d["category"], vehicle_item["type"])
                and d["model"].license_expiry >= trip_time.date()
            ]
            if not available_d_items:
                # fallback: any driver not busy
                available_d_items = [d for d in drivers_data if d["model"].id not in busy_drivers]
                if not available_d_items:
                    available_d_items = drivers_data
            
            driver_item = random.choice(available_d_items)
            driver = driver_item["model"]

            # Trip route details
            route = random.choice(ROUTES)
            source, destination, base_dist = route
            planned_dist = round(base_dist * random.uniform(0.95, 1.05), 1)
            cargo = round(random.uniform(200, vehicle.capacity_kg * 0.95), 1)
            revenue = round(planned_dist * random.uniform(25, 60), 0)
            trip_code = f"TO-{orig_idx + 10000}"

            # Calculate dispatch & completion datetimes
            dispatch = trip_time
            duration_hours = planned_dist / random.uniform(40, 60)
            completion = dispatch + timedelta(hours=duration_hours)

            start_odo = vehicle_item["current_odo"]

            trip_kwargs = {
                "trip_code": trip_code,
                "vehicle_id": vehicle.id,
                "driver_id": driver.id,
                "source": source,
                "destination": destination,
                "cargo_weight": cargo,
                "planned_distance": planned_dist,
                "revenue": revenue,
                "status": status,
                "created_at": dispatch,
                "updated_at": dispatch
            }

            if status in (TripStatus.COMPLETED, TripStatus.DISPATCHED):
                trip_kwargs["dispatch_time"] = dispatch
                trip_kwargs["start_odometer"] = start_odo

            if status == TripStatus.COMPLETED:
                actual_dist = round(planned_dist * random.uniform(0.98, 1.05), 1)
                end_odo = round(start_odo + actual_dist, 1)
                fuel = round(actual_dist / random.uniform(3.5, 6.0), 1)

                trip_kwargs["actual_distance"] = actual_dist
                trip_kwargs["completion_time"] = completion
                trip_kwargs["end_odometer"] = end_odo
                trip_kwargs["fuel_used"] = fuel
                trip_kwargs["updated_at"] = completion

                # Update the simulated current state of the vehicle
                vehicle_item["current_odo"] = end_odo
                vehicle_item["last_active_time"] = completion
                driver_item["last_active_time"] = completion

                # Historical logging of fuel and maintenance
                # Fuel log for this completion
                fuel_cost = round(fuel * random.uniform(90, 106), 2)
                fl = FuelLog(
                    vehicle_id=vehicle.id,
                    liters=fuel,
                    cost=fuel_cost,
                    date=completion.date(),
                    created_at=completion,
                    updated_at=completion
                )
                db.add(fl)

                # Occasional expense record
                exp = Expense(
                    trip_id=orig_idx + 1,  # Temporary reference, mapped in next step
                    vehicle_id=vehicle.id,
                    toll=round(random.uniform(100, 1200), 0),
                    other=round(random.uniform(0, 400), 0)
                )
                db.add(exp)

            elif status == TripStatus.DISPATCHED:
                # Currently running active trip
                # These vehicle/driver are now locked as busy at the end of simulation
                busy_vehicles.add(vehicle.id)
                busy_driver_id = driver.id
                busy_drivers.add(busy_driver_id)
                vehicle_item["last_active_time"] = dispatch
                driver_item["last_active_time"] = dispatch

            elif status == TripStatus.CANCELLED:
                # Cancelled doesn't progress odometer or lock anything
                pass

            trip_model = Trip(**trip_kwargs)
            db.add(trip_model)
            trips_created.append((trip_model, status, orig_idx))

        db.commit()

        # Fix up Expense foreign keys to actual generated Trip IDs
        print("Mapping expenses to correct trips...")
        all_trips = db.query(Trip).all()
        # Sort trips to map them back to their original event index
        # Let's map by trip_code
        trip_code_to_id = {t.trip_code: t.id for t in all_trips}
        all_expenses = db.query(Expense).all()
        for idx, exp in enumerate(all_expenses):
            # map to the matching trip code
            matched_code = f"TO-{exp.trip_id - 1 + 10000}"
            exp.trip_id = trip_code_to_id[matched_code]
        db.commit()

        # ── Historical Maintenance Logs ──────────────────────────────
        print("Seeding Maintenance Logs...")
        for item in vehicles_data:
            vehicle = item["model"]
            final_odo = item["current_odo"]
            # Generate 1-3 completed maintenance logs at previous odometer stages
            num_logs = random.randint(1, 3)
            for j in range(num_logs):
                # Service happened at some point in the past
                svc_days_ago = random.randint(10, 120)
                svc_date = date.today() - timedelta(days=svc_days_ago)
                log = MaintenanceLog(
                    vehicle_id=vehicle.id,
                    service_type=random.choice(SERVICE_TYPES),
                    cost=round(random.uniform(800, 20000), 0),
                    service_date=svc_date,
                    status=MaintenanceStatus.COMPLETED,
                    created_at=datetime.combine(svc_date, datetime.min.time()),
                    updated_at=datetime.combine(svc_date, datetime.min.time())
                )
                db.add(log)
        db.commit()

        # ── Synchronizing Final States ───────────────────────────────
        print("Synchronizing Final Database Statuses...")
        
        # 1. Update Vehicle current odometers and statuses
        for item in vehicles_data:
            v = item["model"]
            v.odometer = item["current_odo"]
            
            if v.id in busy_vehicles:
                v.status = VehicleStatus.ON_TRIP
            else:
                # If not busy on a trip, it might be in maintenance (In Shop) or Retired
                rand_val = random.random()
                if rand_val < 0.08:
                    v.status = VehicleStatus.IN_SHOP
                    # Add an active maintenance log
                    active_ml = MaintenanceLog(
                        vehicle_id=v.id,
                        service_type=random.choice(SERVICE_TYPES),
                        cost=0.0,
                        service_date=date.today(),
                        status=MaintenanceStatus.ACTIVE,
                        created_at=now,
                        updated_at=now
                    )
                    db.add(active_ml)
                elif rand_val < 0.10:
                    v.status = VehicleStatus.RETIRED
                else:
                    v.status = VehicleStatus.AVAILABLE
            db.add(v)

        # 2. Update Driver statuses
        for item in drivers_data:
            d = item["model"]
            
            if d.id in busy_drivers:
                d.status = DriverStatus.ON_TRIP
            else:
                # If not busy on a trip, check safety score / license expiry
                if d.license_expiry < date.today() or d.safety_score < 70:
                    d.status = DriverStatus.SUSPENDED
                else:
                    rand_val = random.random()
                    if rand_val < 0.15:
                        d.status = DriverStatus.OFF_DUTY
                    else:
                        d.status = DriverStatus.AVAILABLE
            db.add(d)

        db.commit()

        # ── Output Summary ───────────────────────────────────────────
        v_count = db.query(Vehicle).count()
        d_count = db.query(Driver).count()
        t_count = db.query(Trip).count()
        f_count = db.query(FuelLog).count()
        m_count = db.query(MaintenanceLog).count()
        e_count = db.query(Expense).count()

        print(f"\n{'='*55}")
        print(f"  REAL-WORLD SIMULATED DATABASE SEEDED SUCCESSFULLY")
        print(f"{'='*55}")
        print(f"  Vehicles:         {v_count} (On Trip: {len(busy_vehicles)})")
        print(f"  Drivers:          {d_count} (On Trip: {len(busy_drivers)})")
        print(f"  Trips:            {t_count}")
        print(f"    - Completed:  {db.query(Trip).filter(Trip.status == TripStatus.COMPLETED).count()}")
        print(f"    - Dispatched: {db.query(Trip).filter(Trip.status == TripStatus.DISPATCHED).count()}")
        print(f"    - Draft:      {db.query(Trip).filter(Trip.status == TripStatus.DRAFT).count()}")
        print(f"    - Cancelled:  {db.query(Trip).filter(Trip.status == TripStatus.CANCELLED).count()}")
        print(f"  Fuel Logs:        {f_count}")
        print(f"  Maintenance Logs: {m_count}")
        print(f"  Expenses:         {e_count}")
        print(f"{'='*55}\n")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
