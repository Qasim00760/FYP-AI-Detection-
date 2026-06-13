@echo off
title Deploy Frontend to Hugging Face
color 0B
set NODE=C:\Users\Hassan\Desktop\Streamlit app - Copy -3\temp-node\node-v20.11.1-win-x64
set PATH=%NODE%;%PATH%

echo ================================================
echo   FRONTEND Deploy to Hugging Face
echo   Space: qasimktk/ai-detection-frontend
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

:: Step 2: Setup fresh git in dist
echo [2/3] Setting up dist folder...
cd dist

if exist ".git" ( rmdir /s /q .git )
git init
git checkout -b main
git config user.email "deploy@ibscs.app"
git config user.name "IBSCS Deploy"
git remote add origin https://qasimktk@huggingface.co/spaces/qasimktk/ai-detection-frontend

git add -A
git commit -m "Deploy IBSCS frontend"

:: Step 3: Push
echo [3/3] Pushing to Hugging Face...
echo (Enter your HF Token when asked for password)
echo.
git push origin main --force

echo.
echo ================================================
echo Frontend live at:
echo https://qasimktk-ai-detection-frontend.hf.space
echo ================================================
pause
