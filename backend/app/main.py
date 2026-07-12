from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.database.base import Base
from app.database.database import engine, get_db

from app.models.role import Role
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.maintenance import MaintenanceLog
from app.models.fuel_log import FuelLog
from app.models.expense import Expense

from app.routers.auth import router as auth_router, login
from app.routers.vehicles import router as vehicles_router
from app.routers.drivers import router as drivers_router
from app.schemas.auth import UserLogin, Token

app = FastAPI(title="TransitOps")

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(vehicles_router)
app.include_router(drivers_router)


# Alias route to support the frontend's AuthContext API contract (POST /login)
@app.post("/login", response_model=Token, tags=["Authentication"])
def root_login(login_data: UserLogin, db: Session = Depends(get_db)):
    return login(login_data, db)


@app.get("/")
def home():
    return {"message": "TransitOps Backend Running"}