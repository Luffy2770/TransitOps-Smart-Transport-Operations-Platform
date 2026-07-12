"""
TransitOps – Realistic Seed Data Generator
============================================
Generates a production-grade dataset for demo / hackathon evaluation:
  • 100 vehicles   (Trucks, Vans, Minis, Tankers, Trailers)
  • 200 drivers    (realistic Indian names, license data)
  • 500 trips      (real Indian city-pair routes, 90-day history)
  • Fuel logs, Maintenance logs, Expenses auto-generated
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

# Real Indian city-pair routes with approximate distances (km)
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

LICENSE_CATEGORIES = ["LMV", "HMV", "HGMV", "HTV"]

# ──────────────────────────────────────────────────────────────────────
# Generator
# ──────────────────────────────────────────────────────────────────────

def seed_database():
    random.seed(42)  # Reproducible data

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

        # ── Users (4 staff accounts) ────────────────────────────────
        print("Seeding Users...")
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

        # ── 100 Vehicles ────────────────────────────────────────────
        print("Seeding 100 Vehicles...")
        vehicles = []
        used_reg = set()
        now = datetime.utcnow()

        for i in range(100):
            v_type = random.choice(VEHICLE_TYPES)
            rto = random.choice(RTO_CODES)
            # Generate unique registration number
            while True:
                suffix = f"{random.randint(1000, 9999)}"
                letter = random.choice("ABCDEFGHJKLMNPRSTUVWXYZ")
                reg = f"{rto}-{letter}{letter}-{suffix}"
                if reg not in used_reg:
                    used_reg.add(reg)
                    break

            cap_lo, cap_hi = CAPACITY_RANGE[v_type]
            cost_lo, cost_hi = COST_RANGE[v_type]

            # Determine status: most Available, some On Trip, few In Shop/Retired
            status_roll = random.random()
            if status_roll < 0.55:
                v_status = VehicleStatus.AVAILABLE
            elif status_roll < 0.80:
                v_status = VehicleStatus.ON_TRIP
            elif status_roll < 0.93:
                v_status = VehicleStatus.IN_SHOP
            else:
                v_status = VehicleStatus.RETIRED

            # Stagger created_at over the past 2 years
            days_ago = random.randint(30, 730)
            created = now - timedelta(days=days_ago, hours=random.randint(0, 23),
                                       minutes=random.randint(0, 59))

            vehicle = Vehicle(
                registration_number=reg,
                name=random.choice(VEHICLE_NAMES[v_type]),
                type=v_type,
                capacity_kg=round(random.uniform(cap_lo, cap_hi), 0),
                status=v_status,
                acquisition_cost=round(random.uniform(cost_lo, cost_hi), 0),
                odometer=round(random.uniform(5000, 250000), 1),
                created_at=created,
                updated_at=created + timedelta(days=random.randint(0, 30)),
            )
            db.add(vehicle)
            vehicles.append(vehicle)

        db.commit()
        for v in vehicles:
            db.refresh(v)

        # ── 200 Drivers ─────────────────────────────────────────────
        print("Seeding 200 Drivers...")
        drivers = []
        used_names = set()
        used_lic = set()

        for i in range(200):
            # Generate unique name
            while True:
                fname = random.choice(INDIAN_FIRST_NAMES)
                lname = random.choice(INDIAN_LAST_NAMES)
                full = f"{fname} {lname}"
                if full not in used_names:
                    used_names.add(full)
                    break

            # Generate unique license number
            while True:
                state_code = random.choice(["MH", "DL", "KA", "TN", "GJ", "RJ", "UP",
                                             "WB", "AP", "TS", "KL", "MP", "HR", "PB"])
                lic_num = f"{state_code}-{random.randint(10, 99)}-{random.randint(100000, 999999)}"
                if lic_num not in used_lic:
                    used_lic.add(lic_num)
                    break

            # Status distribution: ~55% Available, ~20% On Trip, ~15% Off Duty, ~10% Suspended
            status_roll = random.random()
            if status_roll < 0.55:
                d_status = DriverStatus.AVAILABLE
            elif status_roll < 0.75:
                d_status = DriverStatus.ON_TRIP
            elif status_roll < 0.90:
                d_status = DriverStatus.OFF_DUTY
            else:
                d_status = DriverStatus.SUSPENDED

            # License expiry: most valid, some expired
            if random.random() < 0.10:
                expiry = date.today() - timedelta(days=random.randint(5, 180))
            else:
                expiry = date.today() + timedelta(days=random.randint(60, 1200))

            days_ago = random.randint(30, 700)
            created = now - timedelta(days=days_ago, hours=random.randint(0, 23))

            driver = Driver(
                name=full,
                license_number=lic_num,
                license_category=random.choice(LICENSE_CATEGORIES),
                contact_number=f"+91{random.randint(7000000000, 9999999999)}",
                license_expiry=expiry,
                safety_score=round(random.uniform(60.0, 100.0), 1),
                status=d_status,
                created_at=created,
                updated_at=created + timedelta(days=random.randint(0, 20)),
            )
            db.add(driver)
            drivers.append(driver)

        db.commit()
        for d in drivers:
            db.refresh(d)

        # ── 500 Trips (over 90 days of history) ─────────────────────
        print("Seeding 500 Trips...")
        trips = []
        used_codes = set()

        for i in range(500):
            # Generate unique trip code
            while True:
                code = f"TO-{random.randint(10000, 99999)}"
                if code not in used_codes:
                    used_codes.add(code)
                    break

            route = random.choice(ROUTES)
            source, destination, base_dist = route
            planned_dist = round(base_dist * random.uniform(0.95, 1.05), 1)

            vehicle = random.choice(vehicles)
            driver = random.choice(drivers)
            cargo = round(random.uniform(200, vehicle.capacity_kg * 0.95), 1)
            revenue = round(planned_dist * random.uniform(18, 55), 0)

            # Status distribution over history
            status_roll = random.random()
            if status_roll < 0.55:
                t_status = TripStatus.COMPLETED
            elif status_roll < 0.70:
                t_status = TripStatus.DISPATCHED
            elif status_roll < 0.85:
                t_status = TripStatus.DRAFT
            else:
                t_status = TripStatus.CANCELLED

            # Spread created_at over ~90 days
            days_ago = random.randint(0, 90)
            hours_ago = random.randint(0, 23)
            created = now - timedelta(days=days_ago, hours=hours_ago,
                                       minutes=random.randint(0, 59))

            trip_kwargs = dict(
                trip_code=code,
                vehicle_id=vehicle.id,
                driver_id=driver.id,
                source=source,
                destination=destination,
                cargo_weight=cargo,
                planned_distance=planned_dist,
                revenue=revenue,
                status=t_status,
                created_at=created,
                updated_at=created,
            )

            if t_status in (TripStatus.DISPATCHED, TripStatus.COMPLETED):
                dispatch = created + timedelta(hours=random.randint(1, 8))
                trip_kwargs["dispatch_time"] = dispatch
                trip_kwargs["start_odometer"] = round(random.uniform(10000, 200000), 1)

            if t_status == TripStatus.COMPLETED:
                actual_dist = round(planned_dist * random.uniform(0.98, 1.08), 1)
                completion = dispatch + timedelta(hours=int(planned_dist / random.uniform(35, 60)))
                trip_kwargs["actual_distance"] = actual_dist
                trip_kwargs["completion_time"] = completion
                trip_kwargs["end_odometer"] = trip_kwargs["start_odometer"] + actual_dist
                trip_kwargs["fuel_used"] = round(actual_dist / random.uniform(3.0, 6.5), 1)
                trip_kwargs["updated_at"] = completion

            trip = Trip(**trip_kwargs)
            db.add(trip)
            trips.append(trip)

        db.commit()
        for t in trips:
            db.refresh(t)

        # ── Expenses for completed trips ────────────────────────────
        print("Seeding Expenses for completed trips...")
        completed_trips = [t for t in trips if t.status == TripStatus.COMPLETED]
        for trip in completed_trips:
            expense = Expense(
                trip_id=trip.id,
                vehicle_id=trip.vehicle_id,
                toll=round(random.uniform(50, 800), 0),
                other=round(random.uniform(0, 300), 0),
            )
            db.add(expense)
        db.commit()

        # ── Fuel Logs (3-8 per vehicle, historical) ─────────────────
        print("Seeding Fuel Logs...")
        for vehicle in vehicles:
            num_logs = random.randint(3, 8)
            for j in range(num_logs):
                fuel_date = date.today() - timedelta(days=random.randint(1, 90))
                liters = round(random.uniform(30, 250), 2)
                cost_per_liter = random.uniform(88, 110)  # INR per liter
                log = FuelLog(
                    vehicle_id=vehicle.id,
                    liters=liters,
                    cost=round(liters * cost_per_liter, 2),
                    date=fuel_date,
                )
                db.add(log)
        db.commit()

        # ── Maintenance Logs (1-4 per vehicle) ──────────────────────
        print("Seeding Maintenance Logs...")
        for vehicle in vehicles:
            num_logs = random.randint(1, 4)
            for j in range(num_logs):
                svc_date = date.today() - timedelta(days=random.randint(1, 180))
                m_status = (MaintenanceStatus.COMPLETED
                           if random.random() < 0.75
                           else MaintenanceStatus.ACTIVE)
                log = MaintenanceLog(
                    vehicle_id=vehicle.id,
                    service_type=random.choice(SERVICE_TYPES),
                    cost=round(random.uniform(500, 25000), 0),
                    service_date=svc_date,
                    status=m_status,
                )
                db.add(log)
        db.commit()

        # ── Summary ─────────────────────────────────────────────────
        v_count = db.query(Vehicle).count()
        d_count = db.query(Driver).count()
        t_count = db.query(Trip).count()
        f_count = db.query(FuelLog).count()
        m_count = db.query(MaintenanceLog).count()
        e_count = db.query(Expense).count()

        print(f"\n{'='*50}")
        print(f"  DATABASE SEEDED SUCCESSFULLY")
        print(f"{'='*50}")
        print(f"  Vehicles:         {v_count}")
        print(f"  Drivers:          {d_count}")
        print(f"  Trips:            {t_count}")
        print(f"  Fuel Logs:        {f_count}")
        print(f"  Maintenance Logs: {m_count}")
        print(f"  Expenses:         {e_count}")
        print(f"{'='*50}\n")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
