---
title: IBSCS AI Detection Backend
emoji: 🤖
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# IBSCS AI Detection Backend

FastAPI backend for the Integrated Bike Safety and Challan System.

## Endpoints
- `POST /helmet` — Helmet detection
- `POST /plate` — Number plate detection  
- `POST /person` — Person detection
- `POST /detect_all` — All models combined
- `GET /violations` — Get all violations
- `POST /save-violation` — Save a violation
- `GET /challans` — Get all challans
- `POST /generate-challan` — Generate challan
- `POST /mark-paid` — Mark challan as paid
- `GET /stats` — System statistics
- `GET /health` — Health check
