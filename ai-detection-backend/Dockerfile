FROM python:3.10-slim

# Install system dependencies needed for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Run FastAPI app on port 7860 (required by Hugging Face Spaces)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
