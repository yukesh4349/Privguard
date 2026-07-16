@echo off
echo Starting Privguard...

:: Start the Backend in a new window
echo Starting FastAPI Backend on port 8000...
start "Privguard Backend" cmd /k "cd backend && ..\venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Start the Frontend in a new window
echo Starting React Frontend on port 3000...
start "Privguard Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo Privguard is starting up!
echo.
echo API Docs: http://localhost:8000/docs
echo Frontend: http://localhost:3000
echo.
echo Note: Two new terminal windows have been opened. 
echo To stop the application, simply close those two windows.
echo ========================================================
pause
