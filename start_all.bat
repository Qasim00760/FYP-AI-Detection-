@echo off
title AI Detection System - Launcher
color 0A

echo ================================================
echo   AI Detection System - Starting All Services
echo ================================================
echo.

:: Set project root
set ROOT=%~dp0

:: Set portable Node.js path
set NODE_DIR=%ROOT%temp-node\node-v20.11.1-win-x64
set PATH=%NODE_DIR%;%PATH%

:: ---- Check npm ----
echo Checking Node.js...
"%NODE_DIR%\npm.cmd" --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found in temp-node folder!
    pause
    exit /b 1
)
echo Node.js OK.
echo.

:: ---- Install frontend deps if needed ----
if not exist "%ROOT%ai-detection-frontend\node_modules" (
    echo [SETUP] Installing React frontend packages (first time only)...
    cd /d "%ROOT%ai-detection-frontend"
    "%NODE_DIR%\npm.cmd" install
    echo.
)

:: ---- 1. Streamlit App ----
echo [1/3] Starting Streamlit App...
start "Streamlit App" cmd /k "cd /d "%ROOT%" && streamlit run app.py"
timeout /t 3 /nobreak >nul

:: ---- 2. FastAPI Backend ----
echo [2/3] Starting FastAPI Backend...
start "FastAPI Backend" cmd /k "cd /d "%ROOT%ai-detection-backend" && uvicorn main:app --reload --port 8000"
timeout /t 3 /nobreak >nul

:: ---- 3. React Frontend ----
echo [3/3] Starting React Frontend...
start "React Frontend" cmd /k "set PATH=%NODE_DIR%;%PATH% && cd /d "%ROOT%ai-detection-frontend" && "%NODE_DIR%\npm.cmd" run dev"

echo.
echo ================================================
echo   All services started! Open these URLs:
echo.
echo   Streamlit  : http://localhost:8501
echo   FastAPI    : http://localhost:8000
echo   React UI   : http://localhost:5173
echo   API Docs   : http://localhost:8000/docs
echo ================================================
echo.
pause
