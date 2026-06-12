# Deployment Guide: Multi-Model AI Detection Website

This guide details the step-by-step procedure for deploying the **FastAPI Backend** to **Hugging Face Spaces** (Docker) and the **React + Vite Frontend** to **GitHub Pages**.

---

## ⚙️ Phase 1: Deploying the Backend to Hugging Face Spaces

Hugging Face Spaces provides a free Docker container hosting service, which is ideal for serving python-based machine learning endpoints.

### Steps:

1. **Create Hugging Face Account / Log In:**
   - Go to [huggingface.co](https://huggingface.co/) and log in (or sign up for a new account).

2. **Create a New Space:**
   - Click on your profile picture in the top-right and select **New Space** (or go to [huggingface.co/new-space](https://huggingface.co/new-space)).
   - **Space Name:** `ai-detection-backend`
   - **License:** Open Source (e.g. `mit` or leave blank)
   - **SDK:** Select **Docker** (⚠️ *Do NOT select Gradio, Streamlit, or Static*).
   - **Docker Template:** Select **Blank** (or standard).
   - **Space Visibility:** **Public** (required so your GitHub Pages frontend can access it).
   - Click **Create Space**.

3. **Upload Backend Files:**
   Navigate to the **Files and versions** tab of your new Space and upload the contents of the `ai-detection-backend/` folder:
   - `main.py`
   - `requirements.txt`
   - `Dockerfile`
   - `models/` (upload the entire folder including `helmet.pt`, `plate.pt`, and your `person.pt` model).
   
   *Note: If your model weights files are large, you can also push them to the Space repository using Git LFS.*

4. **Verify Space Status:**
   - Once uploaded, Hugging Face will automatically trigger the container build process using your `Dockerfile`.
   - In a few minutes, the status indicator should turn green and show **Running**.
   - Your API space URL will follow this structure:
     ```
     https://<YOUR_HF_USERNAME>-ai-detection-backend.hf.space
     ```
     *For example, if your username is `johndoe`, the URL is: `https://johndoe-ai-detection-backend.hf.space`*

5. **Test the Endpoint:**
   - Open your browser and navigate to `https://<YOUR_HF_USERNAME>-ai-detection-backend.hf.space/health`.
   - It should return: `{"status": "healthy"}`.

---

## 🎨 Phase 2: Deploying the Frontend to GitHub Pages

GitHub Pages is a fast, static hosting service built directly into GitHub.

### Steps:

1. **Update the Backend API URL:**
   - Open [Dashboard.jsx](file:///c:/Users/Hassan/Desktop/Streamlit%20app%20-%20Copy%20-3/ai-detection-frontend/src/pages/Dashboard.jsx).
   - Find the line initializing state for the backend URL (around line 14):
     ```javascript
     const [backendUrl, setBackendUrl] = useState('https://USERNAME-ai-detection-backend.hf.space')
     ```
   - Replace `USERNAME` with your actual Hugging Face username, or customize the default string to point directly to your deployed endpoint.

2. **Initialize a GitHub Repository:**
   - Create a new repository on GitHub named `ai-detection-frontend`.
   - In your local frontend directory `ai-detection-frontend/`, initialize git, add the remote link, and push:
     ```bash
     cd ai-detection-frontend
     git init
     git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/ai-detection-frontend.git
     git add .
     git commit -m "Initialize React Frontend"
     git branch -M main
     git push -u origin main
     ```

3. **Install gh-pages & Build Frontend:**
   - Ensure the dependencies are installed (run `npm install`).
   - Run the build and deployment scripts:
     ```bash
     npm run build
     npm run deploy
     ```
     *This script builds your application into the `dist/` directory and utilizes the `gh-pages` module to push those files to a separate `gh-pages` branch on GitHub.*

4. **Enable GitHub Pages in Repository Settings:**
   - Go to your repository on GitHub.
   - Click on **Settings** &rarr; **Pages** (on the left menu).
   - Under **Build and deployment &rarr; Branch**:
     - Ensure the source is set to **Deploy from a branch**.
     - Select **gh-pages** as the branch, and `/ (root)` as the folder.
     - Click **Save**.

5. **Access Your Live Site:**
   - After a minute, your website will be live at:
     ```
     https://<YOUR_GITHUB_USERNAME>.github.io/ai-detection-frontend/
     ```

---

## 🔍 Troubleshooting & Network CORS Issues

If the browser console displays network error warnings or CORS failures:
- Make sure that **CORS middleware** remains configured in `main.py` allowing all headers and origins:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
- Ensure the Space visibility on Hugging Face is set to **Public** so that external requests are authorized.
- Ensure that the browser protocol matches: if your frontend is served over HTTPS, your backend API endpoint must also be called using HTTPS (`https://...`).
