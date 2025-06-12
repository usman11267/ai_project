@echo off
echo Starting Doctor AI API and Frontend...

REM Start the FastAPI server in a new window
start cmd /k "python -m uvicorn main:app --reload"

REM Start the React development server in a new window
start cmd /k "cd frontend && npm start"

echo Both servers should be starting now.
echo API: http://localhost:8000
echo Frontend: http://localhost:3000 