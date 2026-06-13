@echo off
title Deploy Backend to Hugging Face
color 0A
cd /d "C:\Users\Hassan\Desktop\Streamlit app - Copy -3\ai-detection-backend"

echo ================================================
echo   BACKEND Deploy to Hugging Face Spaces
echo   Space: Qasim00760/ai-detection-backend
echo ================================================
echo.
echo IMPORTANT: When asked for password, paste your
echo HF Token (from huggingface.co/settings/tokens)
echo.
pause

:: Init git if needed
if not exist ".git" (
    git init
    git checkout -b main
)

:: Set remote
git remote remove hf 2>nul
git remote add hf https://Qasim00760@huggingface.co/spaces/Qasim00760/ai-detection-backend

:: Stage and commit
git add -A
git commit -m "Deploy IBSCS backend v2"

:: Push
echo.
echo Pushing to Hugging Face... (enter HF token when prompted)
echo.
git push hf main --force

echo.
echo ================================================
echo Backend URL: https://Qasim00760-ai-detection-backend.hf.space
echo API Docs:   https://Qasim00760-ai-detection-backend.hf.space/docs
echo.
echo NOTE: First build takes 5-10 minutes on HF.
echo Watch progress at:
echo https://huggingface.co/spaces/Qasim00760/ai-detection-backend
echo ================================================
pause
