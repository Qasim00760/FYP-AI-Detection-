@echo off
title Commit to GitHub
color 0A
cd /d "C:\Users\Hassan\Desktop\Streamlit app - Copy -3"

echo ================================================
echo   Committing to GitHub
echo   Repo: FYP-AI-Detection-
echo ================================================
echo.

git add -A
git status
echo.
git commit -m "Add combined frontend+backend deployment"
git push origin main --force

echo.
echo ================================================
echo Done! Check: https://github.com/Qasim00760/FYP-AI-Detection-
echo ================================================
pause
