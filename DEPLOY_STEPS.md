# Hugging Face Deployment Guide

## Step 1 — HF Token banao
1. https://huggingface.co/settings/tokens
2. "New token" → Name: "deploy" → Role: Write → Generate
3. Token copy karo (ghp_... jaisa hoga)

## Step 2 — 2 Spaces banao

### Space 1 (Backend):
1. https://huggingface.co/new-space
2. Space name: `ai-detection-backend`
3. SDK: **Docker**
4. Visibility: Public
5. Create Space

### Space 2 (Frontend):
1. https://huggingface.co/new-space  
2. Space name: `ai-detection-frontend`
3. SDK: **Static**
4. Visibility: Public
5. Create Space

## Step 3 — Backend Deploy karo
`deploy_backend_hf.bat` double click karo
- Username: Qasim00760
- Password: (apna HF token paste karo)

## Step 4 — Frontend Deploy karo
`deploy_frontend_hf.bat` double click karo
- Username: Qasim00760
- Password: (apna HF token paste karo)

## Final URLs
- Backend:  https://Qasim00760-ai-detection-backend.hf.space
- Frontend: https://Qasim00760-ai-detection-frontend.hf.space
- API Docs: https://Qasim00760-ai-detection-backend.hf.space/docs
