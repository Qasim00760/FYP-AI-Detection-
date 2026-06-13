@echo off
title Deploy Backend to Hugging Face
color 0A

echo ================================================
echo   BACKEND Deploy to Hugging Face Spaces
echo   Space: Qasim00760/ai-detection-backend
echo   SDK: Docker
echo ================================================
echo.
echo When asked for password: paste your HF Token
echo Get token: https://huggingface.co/settings/tokens
echo.
pause

cd /d "C:\Users\Hassan\Desktop\Streamlit app - Copy -3\ai-detection-backend"

:: Setup git
if not exist ".git" (
    git init
    git checkout -b main
)
git config user.email "deploy@ibscs.app"
git config user.name "IBSCS Deploy"

git remote remove hf 2>nul
git remote add hf https://Qasim00760@huggingface.co/spaces/Qasim00760/ai-detection-backend

git add -A
git commit -m "Deploy IBSCS backend v2 - FastAPI + YOLO"

echo.
echo Pushing to Hugging Face... (Enter HF Token as password)
echo.
git push hf main --force

echo.
echo ================================================
echo Backend live at:
echo https://Qasim00760-ai-detection-backend.hf.space
echo API Docs:
echo https://Qasim00760-ai-detection-backend.hf.space/docs
echo.
echo NOTE: Docker build takes 5-10 minutes on HF.
echo Watch: https://huggingface.co/spaces/Qasim00760/ai-detection-backend
echo ================================================
pause
