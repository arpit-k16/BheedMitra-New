@echo off
setlocal
REM BheedMitra - Full Stack Launcher (Backend + Streamlit + React)

echo ================================================
echo   BheedMitra - AI Crowd Management System
echo   Full Stack Launcher
echo ================================================
echo.

REM Resolve paths relative to this script (backend folder)
set "BACKEND_DIR=%~dp0"
for %%I in ("%BACKEND_DIR%..") do set "ROOT_DIR=%%~fI"
set "FRONTEND_DIR=%ROOT_DIR%\frontend"
set "DATA_DIR=%ROOT_DIR%\data"

cd /d "%BACKEND_DIR%"

echo [1/7] Installing Python dependencies...
if exist "%ROOT_DIR%\requirements.txt" (
    python -m pip install -r "%ROOT_DIR%\requirements.txt" -q
) else (
    python -m pip install -r requirements.txt -q
)

echo.
echo [2/7] Installing frontend dependencies...
call npm --prefix "%FRONTEND_DIR%" install --silent 2>nul

echo.
echo [3/7] Preparing DMRC dataset/model (if missing)...
if not exist "%DATA_DIR%\dmrc_timeseries_combined.csv" (
    if exist "%ROOT_DIR%\data_pipeline\aggregate_timeseries.py" (
        python "%ROOT_DIR%\data_pipeline\aggregate_timeseries.py"
    )
)
if not exist "%DATA_DIR%\saved_models\xgb_platform_crowd.pkl" (
    python "%ROOT_DIR%\train_model.py"
)

echo.
echo [4/7] Preparing MTA dataset/model (if source exists)...
if exist "%DATA_DIR%\MTA_Subway_Hourly_Ridership.csv" (
    if not exist "%DATA_DIR%\mta_timeseries_combined.csv" (
        python -c "from models.train_model import train_system_models; print(train_system_models(system='MTA', sample_size=1000000))"
    )
    if not exist "%DATA_DIR%\saved_models\mta_xgb_platform_crowd.pkl" (
        python -c "from models.train_model import train_system_models; print(train_system_models(system='MTA', sample_size=1000000))"
    )
) else (
    echo    MTA source CSV not found at "%DATA_DIR%\MTA_Subway_Hourly_Ridership.csv" (skipping MTA prep)
)

echo.
echo [5/7] Finding available ports...
for /f "tokens=1,2" %%a in ('python -c "from utils.port_config import get_ports; p,a=get_ports(); print(p,a)"') do (
    set "PASSENGER_PORT=%%a"
    set "ADMIN_PORT=%%b"
)
if "%PASSENGER_PORT%"=="" set "PASSENGER_PORT=8501"
if "%ADMIN_PORT%"=="" set "ADMIN_PORT=8502"
set "BACKEND_PORT=8000"

echo    Passenger Port: %PASSENGER_PORT%
echo    Admin Port:     %ADMIN_PORT%
echo    Backend Port:   %BACKEND_PORT%

echo.
echo [6/7] Starting services...
start "BheedMitra Backend API" cmd /k "cd /d "%BACKEND_DIR%" && python -m uvicorn main:app --reload --host 0.0.0.0 --port %BACKEND_PORT%"
timeout /t 3 /nobreak > nul

start "BheedMitra Passenger Panel" cmd /k "cd /d "%BACKEND_DIR%" && python -m streamlit run streamlit_passenger.py --server.port %PASSENGER_PORT%"
timeout /t 2 /nobreak > nul

start "BheedMitra Admin Panel" cmd /k "cd /d "%BACKEND_DIR%" && python -m streamlit run streamlit_admin.py --server.port %ADMIN_PORT%"
timeout /t 2 /nobreak > nul

start "BheedMitra React Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo [7/7] Done.
echo ================================================
echo   SERVICES RUNNING:
echo ================================================
echo   React Frontend:   http://localhost:5173
echo   Backend API:      http://localhost:%BACKEND_PORT%
echo   Passenger Panel:  http://localhost:%PASSENGER_PORT%
echo   Admin Panel:      http://localhost:%ADMIN_PORT%
echo ================================================
echo.
echo Press any key to open the frontend...
pause > nul
start http://localhost:5173

endlocal
