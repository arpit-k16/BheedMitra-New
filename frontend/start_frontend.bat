@echo off
REM Start React Landing Page
echo ================================================
echo BheedMitra Frontend
echo ================================================
echo.

cd /d "%~dp0"
echo Starting React Landing Page on port 5173...
start "BheedMitra React" cmd /k "npm run dev"

echo.
echo ================================================
echo   React Landing:  http://localhost:5173
echo ================================================
echo.
pause
