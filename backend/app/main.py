from fastapi import FastAPI

from app.database.base import Base
from app.database.database import engine

from app.models.role import Role
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.maintenance import MaintenanceLog
from app.models.fuel_log import FuelLog
from app.models.expense import Expense

app = FastAPI(title="TransitOps")

Base.metadata.create_all(bind=engine)


@app.get("/")
def home():
    return {"message": "TransitOps Backend Running 🚛"}