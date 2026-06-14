@echo off
title Commit to GitHub
color 0A
cd /d "C:\Users\Hassan\Desktop\Streamlit app - Copy -3"

echo ================================================
echo   Committing Clean Project to GitHub
echo   Repo: https://github.com/Qasim00760/FYP-AI-Detection-
echo ================================================
echo.

git remote remove origin 2>nul
git remote add origin https://github.com/Qasim00760/FYP-AI-Detection-.git

git add .
git status
echo.
git commit -m "Clean project structure - IBSCS FYP"
git branch -M main
git push -u origin main --force

echo.
echo ================================================
echo Done! Check GitHub:
echo https://github.com/Qasim00760/FYP-AI-Detection-
echo ================================================
pause
