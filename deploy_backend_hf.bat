@echo off
title Deploy Backend to Hugging Face
color 0A
cd /d "C:\Users\Hassan\Desktop\Streamlit app - Copy -3\ai-detection-backend"

echo ================================================
echo   Deploying BACKEND to Hugging Face Spaces
echo ================================================
echo.
echo Your HF username: Qasim00760
echo Space name will be: ai-detection-backend
echo URL will be: https://huggingface.co/spaces/Qasim00760/ai-detection-backend
echo.

:: Check if git remote already set
git remote remove hf-backend 2>nul

echo Setting up Hugging Face remote...
git remote add hf-backend https://Qasim00760@huggingface.co/spaces/Qasim00760/ai-detection-backend

echo.
echo Initializing local repo for backend...
git init
git add .
git commit -m "Deploy IBSCS backend to Hugging Face"

echo.
echo Pushing to Hugging Face...
echo (You will be asked for your HF token as password)
echo Get token from: https://huggingface.co/settings/tokens
echo.
git push hf-backend main --force

echo.
echo ================================================
echo DONE! Backend will be live at:
echo https://Qasim00760-ai-detection-backend.hf.space
echo ================================================
pause
