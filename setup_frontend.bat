@echo off
title Installing Frontend Packages
color 0A

set NODE="%~dp0temp-node\node-v20.11.1-win-x64\npm.cmd"
set FRONTEND="%~dp0ai-detection-frontend"

echo ================================================
echo   Installing React Frontend Packages...
echo ================================================
echo.

cd /d "%~dp0ai-detection-frontend"
"%~dp0temp-node\node-v20.11.1-win-x64\npm.cmd" install

echo.
echo ================================================
echo   Done! Now run start_all.bat
echo ================================================
pause
