---
title: IBSCS Streamlit
emoji: 🚴
colorFrom: blue
colorTo: green
sdk: docker
app_file: app.py
pinned: false
---

# Integrated Bike Safety and Challan System (IBSCS)

AI-assisted live helmet violation detection and challan management system.

## Features

- 🪖 Helmet detection using YOLOv8 (with/without helmet classification)
- 🚗 Number plate detection and OCR text extraction
- ✅ Operator-confirmed challan generation (never auto-generated)
- 📋 Violation and challan history with search and date filters
- 📊 Dashboard with real-time statistics
- 📷 Live camera feed with per-frame detection
- ⚙️ Configurable thresholds and fine amounts

## Folder Structure

```
ibscs-streamlit/
├── app.py
├── requirements.txt
├── Dockerfile
├── README.md
├── models/
│   ├── helmet_detection.pt
│   └── number_plate_detection.pt
├── data/
│   ├── violations.csv
│   └── challans.csv
└── outputs/
    └── evidence/
```

## Setup

```bash
pip install -r requirements.txt
streamlit run app.py
```

## Models Required

Place your trained YOLOv8 `.pt` files in the `models/` folder:
- `helmet_detection.pt` — detects: with helmet, without helmet, rider
- `number_plate_detection.pt` — detects: number plate / license plate

## Challan Format

```
IBSCS-2026-000001
```

## Evidence File Format

```
LEA1234_20260612_182530.jpg
```

## Detection Logic

- If both `with helmet` AND `without helmet` detected → uses **higher confidence** one
- Challan generated **only** when:
  1. Helmet violation confirmed
  2. Number plate detected
  3. OCR confidence ≥ threshold
  4. Operator clicks **Generate Challan** button
