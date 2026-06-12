@echo off
title Pushing to GitHub
color 0A
cd /d "%~dp0"

echo ================================================
echo   Pushing to GitHub...
echo ================================================
echo.

git add .
echo [1/3] Files staged.

git commit -m "Initial commit - FYP AI Detection System"
echo [2/3] Committed.

git remote remove origin 2>nul
git remote add origin https://github.com/Qasim00760/FYP-AI-Detection.git
git branch -M main

echo [3/3] Pushing to GitHub...
git push -u origin main

echo.
echo ================================================
echo   Done! Check: https://github.com/Qasim00760/FYP-AI-Detection
echo ================================================
pause
