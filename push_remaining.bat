@echo off
title Push Remaining Files to GitHub
color 0A
cd /d "%~dp0"

echo ================================================
echo   Pushing remaining files to GitHub...
echo ================================================
echo.

git add ai-detection-frontend/README.md
git commit -m "Add frontend README"
git push origin main

echo.
echo ================================================
echo   Done! Check: https://github.com/Qasim00760/FYP-AI-Detection
echo ================================================
pause
