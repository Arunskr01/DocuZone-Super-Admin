@echo off
echo Starting Super Admin Backend and Frontend...

:: Start the FastAPI backend in a new window
start "Super Admin Backend" cmd /k ".\venv\Scripts\activate && python -m uvicorn backend.main:app --reload --host 0.0.0.0"

:: Start the Vite frontend in the current window
cd frontend
npm run dev -- --host
