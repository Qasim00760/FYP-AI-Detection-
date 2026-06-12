@echo off
title Stopping All Services
color 0C

echo Stopping all AI Detection services...
echo.

:: Kill by window title
taskkill /FI "WINDOWTITLE eq Streamlit App*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq FastAPI Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq React Frontend*" /F >nul 2>&1

:: Kill by process name
taskkill /IM "streamlit.exe" /F >nul 2>&1
taskkill /IM "uvicorn.exe" /F >nul 2>&1

:: Kill node processes running vite
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo list ^| findstr "PID"') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo All services stopped!
pause
