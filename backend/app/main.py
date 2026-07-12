from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
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
from app.routers.trips import router as trips_router
from app.routers.maintenance import router as maintenance_router
from app.routers.fuel_expenses import router as fuel_expenses_router
from app.routers.analytics import router as analytics_router
from app.schemas.auth import UserLogin, Token

app = FastAPI(title="TransitOps")

# Enable CORS middleware to allow the frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon/local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Include all routers
app.include_router(auth_router)
app.include_router(vehicles_router)
app.include_router(drivers_router)
app.include_router(trips_router)
app.include_router(maintenance_router)
app.include_router(fuel_expenses_router)
app.include_router(analytics_router)


# Alias route to support the frontend's AuthContext API contract (POST /login)
@app.post("/login", response_model=Token, tags=["Authentication"])
def root_login(login_data: UserLogin, db: Session = Depends(get_db)):
    return login(login_data, db)


@app.get("/")
def home():
    return {"message": "TransitOps Backend Running"}