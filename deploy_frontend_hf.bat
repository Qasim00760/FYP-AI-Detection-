@echo off
title Deploy Frontend to Hugging Face
color 0B
set NODE=C:\Users\Hassan\Desktop\Streamlit app - Copy -3\temp-node\node-v20.11.1-win-x64
set PATH=%NODE%;%PATH%

echo ================================================
echo   FRONTEND Deploy to Hugging Face Spaces
echo   Space: Qasim00760/ai-detection-frontend
echo ================================================
echo.
echo IMPORTANT: When asked for password, paste your
echo HF Token (from huggingface.co/settings/tokens)
echo.
pause

:: Build React app
echo [1/4] Building React app...
cd /d "C:\Users\Hassan\Desktop\Streamlit app - Copy -3\ai-detection-frontend"
"%NODE%\npm.cmd" run build
if errorlevel 1 (
    echo BUILD FAILED! Check errors above.
    pause
    exit /b 1
)
echo Build OK!

:: Go into dist
cd dist
echo.

:: Init git in dist
echo [2/4] Setting up git in dist...
if not exist ".git" (
    git init
    git checkout -b main
)

git remote remove hf 2>nul
git remote add hf https://Qasim00760@huggingface.co/spaces/Qasim00760/ai-detection-frontend

:: Commit
echo [3/4] Committing built files...
git add -A
git commit -m "Deploy IBSCS frontend"

:: Push
echo.
echo [4/4] Pushing to Hugging Face... (enter HF token when prompted)
echo.
git push hf main --force

echo.
echo ================================================
echo Frontend URL: https://Qasim00760-ai-detection-frontend.hf.space
echo.
echo NOTE: Static sites go live in ~1 minute.
echo Watch at:
echo https://huggingface.co/spaces/Qasim00760/ai-detection-frontend
echo ================================================
pause
