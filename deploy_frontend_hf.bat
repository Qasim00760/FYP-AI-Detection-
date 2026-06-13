@echo off
title Deploy Frontend to Hugging Face
color 0B
set NODE=C:\Users\Hassan\Desktop\Streamlit app - Copy -3\temp-node\node-v20.11.1-win-x64
set PATH=%NODE%;%PATH%

echo ================================================
echo   FRONTEND Deploy to Hugging Face Spaces
echo   Space: Qasim00760/ai-detection-frontend
echo   SDK: Static
echo ================================================
echo.
echo When asked for password: paste your HF Token
echo Get token: https://huggingface.co/settings/tokens
echo.
pause

:: Step 1: Build
echo [1/3] Building React app...
cd /d "C:\Users\Hassan\Desktop\Streamlit app - Copy -3\ai-detection-frontend"
"%NODE%\npm.cmd" run build
if errorlevel 1 ( echo BUILD FAILED! & pause & exit /b 1 )
echo Build complete!

:: Step 2: Setup git in dist
echo [2/3] Setting up dist folder for HF...
cd dist

if exist ".git" ( rmdir /s /q .git )
git init
git checkout -b main
git config user.email "deploy@ibscs.app"
git config user.name "IBSCS Deploy"

git remote add hf https://Qasim00760@huggingface.co/spaces/Qasim00760/ai-detection-frontend

git add -A
git commit -m "Deploy IBSCS frontend - built React app"

:: Step 3: Push
echo [3/3] Pushing to Hugging Face...
echo (Enter your HF Token when prompted for password)
echo.
git push hf main --force

echo.
echo ================================================
echo Frontend live at:
echo https://Qasim00760-ai-detection-frontend.hf.space
echo ================================================
pause
