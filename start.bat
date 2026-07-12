@echo off
echo =========================================
echo Starting TransitOps Local Environment...
echo =========================================

:: 1. Go to backend, activate environment, and seed the database
echo [1/3] Seeding the database...
cd backend
call .\venv\Scripts\activate
python -m app.database.seed

:: 2. Start the backend server in a separate new window
echo [2/3] Starting backend server...
start cmd /k ".\venv\Scripts\activate && uvicorn app.main:app --reload"

:: 3. Go to frontend and start the React server in another new window
echo [3/3] Starting frontend server...
cd ..\frontend
start cmd /k "npm run dev"

echo =========================================
echo Done! Closing this launcher...