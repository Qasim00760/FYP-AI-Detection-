@echo off
title Deploy Frontend to Hugging Face
color 0B
set NODE=C:\Users\Hassan\Desktop\Streamlit app - Copy -3\temp-node\node-v20.11.1-win-x64
set PATH=%NODE%;%PATH%
cd /d "C:\Users\Hassan\Desktop\Streamlit app - Copy -3\ai-detection-frontend"

echo ================================================
echo   Deploying FRONTEND to Hugging Face Spaces
echo ================================================
echo.
echo Your HF username: Qasim00760
echo Space name will be: ai-detection-frontend
echo URL will be: https://huggingface.co/spaces/Qasim00760/ai-detection-frontend
echo.

:: Build latest version
echo [1/3] Building React app...
"%NODE%\npm.cmd" run build
if errorlevel 1 (
    echo BUILD FAILED!
    pause
    exit /b 1
)
echo Build complete!
echo.

:: Go into dist folder
cd dist

:: Setup git in dist
echo [2/3] Setting up git in dist folder...
git init
git remote remove hf-frontend 2>nul
git remote add hf-frontend https://Qasim00760@huggingface.co/spaces/Qasim00760/ai-detection-frontend

git add .
git commit -m "Deploy IBSCS frontend to Hugging Face"

echo.
echo [3/3] Pushing to Hugging Face...
echo (You will be asked for your HF token as password)
echo Get token from: https://huggingface.co/settings/tokens
echo.
git push hf-frontend main --force

echo.
echo ================================================
echo DONE! Frontend will be live at:
echo https://Qasim00760-ai-detection-frontend.hf.space
echo ================================================
pause
