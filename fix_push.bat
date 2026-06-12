@echo off
title Fix GitHub Push
color 0A
cd /d "C:\Users\Hassan\Desktop\Streamlit app - Copy -3"

echo Current directory:
cd
echo.

echo ================================================
echo   Fixing GitHub remote and pushing all files...
echo ================================================
echo.

:: Remove wrong remote and set correct one
git remote remove origin 2>nul
git remote add origin https://github.com/Qasim00760/FYP-AI-Detection-.git

:: Stage all files from ROOT folder
git add .
git status

echo.
echo Committing...
git commit -m "Add all project files - app.py, backend, frontend"

echo.
echo Pushing to GitHub...
git push -u origin main --force

echo.
echo ================================================
echo   Done! Check: https://github.com/Qasim00760/FYP-AI-Detection-
echo ================================================
pause
