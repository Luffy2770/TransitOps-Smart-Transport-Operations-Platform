from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.auth import UserLogin, Token, UserResponse, ChangePassword
from app.core.security import verify_password, create_access_token, get_current_user, hash_password
from app.core.dependencies import RoleChecker
from app.database.seed import seed_database

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    role_name = user.role.name if user.role else "User"

    access_token = create_access_token(data={"sub": user.email, "role": role_name})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_name,
        "name": user.name,
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    role_name = current_user.role.name if current_user.role else "User"
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": role_name,
    }


@router.post("/change-password")
def change_password(
    data: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.post("/reset-db")
def reset_db(
    _current_user=Depends(RoleChecker(["Fleet Manager"])),
):
    try:
        seed_database()
        return {"message": "Database successfully reset and seeded!"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reset failed: {str(e)}",
        )
