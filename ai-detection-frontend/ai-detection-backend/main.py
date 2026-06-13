import io
import os
import csv
import uuid
import base64
import numpy as np
import cv2
from PIL import Image
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from ultralytics import YOLO

app = FastAPI(
    title="IBSCS AI Detection API",
    description="FastAPI backend for Integrated Bike Safety and Challan System",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# PATHS & CSV SETUP
# ==========================
DATA_DIR      = "data"
EVIDENCE_DIR  = "outputs/evidence"
VIOLATIONS_CSV = os.path.join(DATA_DIR, "violations.csv")
CHALLANS_CSV   = os.path.join(DATA_DIR, "challans.csv")

os.makedirs(DATA_DIR,     exist_ok=True)
os.makedirs(EVIDENCE_DIR, exist_ok=True)

VIOLATION_COLS = ["id", "vehicle_number", "helmet_status", "helmet_confidence",
                  "ocr_confidence", "image_path", "timestamp", "source_type"]
CHALLAN_COLS   = ["challan_number", "vehicle_number", "amount", "status",
                  "created_at", "paid_at", "evidence_path"]

def init_csv(path, cols):
    if not os.path.exists(path):
        with open(path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=cols)
            writer.writeheader()

init_csv(VIOLATIONS_CSV, VIOLATION_COLS)
init_csv(CHALLANS_CSV,   CHALLAN_COLS)

# ==========================
# CSV HELPERS
# ==========================
def read_csv(path, cols):
    rows = []
    if not os.path.exists(path):
        return rows
    with open(path, "r", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(dict(row))
    return rows

def append_csv(path, cols, row):
    file_exists = os.path.exists(path)
    with open(path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=cols)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)

def rewrite_csv(path, cols, rows):
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=cols)
        writer.writeheader()
        writer.writerows(rows)

# ==========================
# MODELS
# ==========================
helmet_model = None
plate_model  = None
person_model = None

@app.on_event("startup")
async def load_models():
    global helmet_model, plate_model, person_model
    os.makedirs("models", exist_ok=True)

    for attr, path, fallback in [
        ("helmet_model", "models/helmet.pt",  True),
        ("plate_model",  "models/plate.pt",   True),
        ("person_model", "models/person.pt",  True),
    ]:
        if os.path.exists(path):
            print(f"Loading {path}")
            globals()[attr] = YOLO(path)
        elif fallback:
            print(f"Warning: {path} not found. Using yolov8n.pt fallback.")
            globals()[attr] = YOLO("yolov8n.pt")

    helmet_model = globals()["helmet_model"]
    plate_model  = globals()["plate_model"]
    person_model = globals()["person_model"]
    print("All models loaded.")

# ==========================
# DETECTION HELPERS
# ==========================
def decode_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    return img_bgr

def run_inference(model, img_bgr, conf_thresh=0.25):
    results    = model(img_bgr)
    detections = []
    boxes      = results[0].boxes

    if boxes is not None:
        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf      = float(box.conf[0])
            cls_id    = int(box.cls[0])
            class_name = model.names[cls_id]
            if conf < conf_thresh:
                continue
            detections.append({
                "class":      class_name,
                "confidence": conf,
                "bbox":       [x1, y1, x2, y2]
            })
    return detections

def annotate_image(img_bgr, detections, model_type="generic"):
    img = img_bgr.copy()
    for det in detections:
        x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
        cls  = det["class"].lower()
        conf = det["confidence"]

        # Color by class
        if "without" in cls or "no helmet" in cls:
            color = (59, 17, 244)    # Red BGR
        elif "with" in cls or cls == "helmet":
            color = (16, 185, 129)   # Green BGR
        elif "rider" in cls or "person" in cls or "passenger" in cls:
            color = (99, 102, 241)   # Indigo BGR
        elif "plate" in cls or "number" in cls:
            color = (36, 191, 251)   # Amber BGR
        else:
            color = (59, 130, 246)   # Blue BGR

        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        label = f"{det['class']} {conf:.0%}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        label_y = max(y1, th + 10)
        cv2.rectangle(img, (x1, label_y - th - 6), (x1 + tw + 4, label_y), color, -1)
        cv2.putText(img, label, (x1 + 2, label_y - 3),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
    return img

def image_to_base64(img_bgr):
    _, buffer = cv2.imencode('.jpg', img_bgr)
    return base64.b64encode(buffer).decode('utf-8')

def detect_helmet_violation(detections):
    """Returns helmet violation status using higher-confidence rule."""
    with_conf    = 0.0
    without_conf = 0.0
    for det in detections:
        cls  = det["class"].lower()
        conf = det["confidence"]
        if "without" in cls or "no helmet" in cls:
            without_conf = max(without_conf, conf)
        elif "with" in cls or cls == "helmet":
            with_conf = max(with_conf, conf)

    if with_conf > 0 and without_conf > 0:
        violation = without_conf > with_conf
        status    = "Without Helmet" if violation else "With Helmet"
        conf_val  = without_conf if violation else with_conf
    elif without_conf > 0:
        violation, status, conf_val = True,  "Without Helmet", without_conf
    elif with_conf > 0:
        violation, status, conf_val = False, "With Helmet",    with_conf
    else:
        violation, status, conf_val = False, "No Rider Detected", 0.0

    return violation, status, conf_val

def generate_challan_number():
    rows = read_csv(CHALLANS_CSV, CHALLAN_COLS)
    year = datetime.now().year
    num  = len(rows) + 1
    return f"IBSCS-{year}-{num:06d}"

def save_evidence(img_bgr, vehicle_number):
    ts        = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = "".join(c for c in vehicle_number if c.isalnum()) or "UNKNOWN"
    filename  = f"{safe_name}_{ts}.jpg"
    filepath  = os.path.join(EVIDENCE_DIR, filename)
    cv2.imwrite(filepath, img_bgr)
    return filepath

# ==========================
# PYDANTIC MODELS
# ==========================
class ViolationIn(BaseModel):
    vehicle_number:    str
    helmet_status:     str
    helmet_confidence: float
    ocr_confidence:    float
    image_path:        Optional[str] = ""
    source_type:       Optional[str] = "image_upload"

class ChallanIn(BaseModel):
    vehicle_number: str
    amount:         float
    evidence_path:  Optional[str] = ""

class MarkPaidIn(BaseModel):
    challan_number: str

# ==========================
# DETECTION ENDPOINTS
# ==========================
@app.post("/helmet")
async def detect_helmet(file: UploadFile = File(...)):
    try:
        img_bgr    = decode_image(await file.read())
        detections = run_inference(helmet_model, img_bgr)
        annotated  = annotate_image(img_bgr, detections)

        violation, status, conf = detect_helmet_violation(detections)

        return {
            "detections":      detections,
            "annotated_image": image_to_base64(annotated),
            "count":           len(detections),
            "helmet_violation": violation,
            "helmet_status":   status,
            "helmet_confidence": conf,
            "plate_text":      "",
            "ocr_confidence":  0.0,
            "plate_detected":  False,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/plate")
async def detect_plate(file: UploadFile = File(...)):
    try:
        img_bgr    = decode_image(await file.read())
        detections = run_inference(plate_model, img_bgr)
        annotated  = annotate_image(img_bgr, detections)
        return {
            "detections":      detections,
            "annotated_image": image_to_base64(annotated),
            "count":           len(detections),
            "helmet_violation": False,
            "helmet_status":   "N/A",
            "helmet_confidence": 0.0,
            "plate_text":      "",
            "ocr_confidence":  0.0,
            "plate_detected":  len(detections) > 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/person")
async def detect_person(file: UploadFile = File(...)):
    try:
        img_bgr    = decode_image(await file.read())
        detections = run_inference(person_model, img_bgr)
        annotated  = annotate_image(img_bgr, detections)
        return {
            "detections":      detections,
            "annotated_image": image_to_base64(annotated),
            "count":           len(detections),
            "helmet_violation": False,
            "helmet_status":   "N/A",
            "helmet_confidence": 0.0,
            "plate_text":      "",
            "ocr_confidence":  0.0,
            "plate_detected":  False,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect_all")
async def detect_all(file: UploadFile = File(...)):
    try:
        img_bgr   = decode_image(await file.read())
        img_clean = img_bgr.copy()
        all_dets  = []

        for model in [helmet_model, plate_model, person_model]:
            if model:
                dets = run_inference(model, img_clean)
                all_dets.extend(dets)

        annotated = annotate_image(img_bgr, all_dets)
        violation, status, h_conf = detect_helmet_violation(all_dets)

        plate_detected = any(
            "plate" in d["class"].lower() or "number" in d["class"].lower()
            for d in all_dets
        )

        return {
            "detections":       all_dets,
            "annotated_image":  image_to_base64(annotated),
            "count":            len(all_dets),
            "helmet_violation": violation,
            "helmet_status":    status,
            "helmet_confidence": h_conf,
            "plate_text":       "",
            "ocr_confidence":   0.0,
            "plate_detected":   plate_detected,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================
# VIOLATIONS ENDPOINTS
# ==========================
@app.get("/violations")
async def get_violations():
    rows = read_csv(VIOLATIONS_CSV, VIOLATION_COLS)
    return {"violations": rows, "total": len(rows)}


@app.post("/save-violation")
async def save_violation(data: ViolationIn):
    try:
        row = {
            "id":                str(uuid.uuid4())[:8],
            "vehicle_number":    data.vehicle_number,
            "helmet_status":     data.helmet_status,
            "helmet_confidence": round(data.helmet_confidence * 100, 2),
            "ocr_confidence":    round(data.ocr_confidence * 100, 2),
            "image_path":        data.image_path or "",
            "timestamp":         datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "source_type":       data.source_type or "image_upload",
        }
        append_csv(VIOLATIONS_CSV, VIOLATION_COLS, row)
        return {"success": True, "id": row["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================
# CHALLANS ENDPOINTS
# ==========================
@app.get("/challans")
async def get_challans():
    rows = read_csv(CHALLANS_CSV, CHALLAN_COLS)
    return {"challans": rows, "total": len(rows)}


@app.post("/generate-challan")
async def generate_challan(data: ChallanIn):
    try:
        challan_number = generate_challan_number()
        row = {
            "challan_number": challan_number,
            "vehicle_number": data.vehicle_number,
            "amount":         data.amount,
            "status":         "pending",
            "created_at":     datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "paid_at":        "",
            "evidence_path":  data.evidence_path or "",
        }
        append_csv(CHALLANS_CSV, CHALLAN_COLS, row)
        return {"success": True, "challan_number": challan_number}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/mark-paid")
async def mark_paid(data: MarkPaidIn):
    try:
        rows = read_csv(CHALLANS_CSV, CHALLAN_COLS)
        found = False
        for row in rows:
            if row["challan_number"] == data.challan_number:
                row["status"]  = "paid"
                row["paid_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Challan not found")
        rewrite_csv(CHALLANS_CSV, CHALLAN_COLS, rows)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================
# STATS ENDPOINT
# ==========================
@app.get("/stats")
async def get_stats():
    violations = read_csv(VIOLATIONS_CSV, VIOLATION_COLS)
    challans   = read_csv(CHALLANS_CSV,   CHALLAN_COLS)

    today = datetime.now().strftime("%Y-%m-%d")

    total_violations  = len(violations)
    total_challans    = len(challans)
    pending_challans  = sum(1 for c in challans if c.get("status") == "pending")
    paid_challans     = sum(1 for c in challans if c.get("status") == "paid")
    today_violations  = sum(1 for v in violations if v.get("timestamp", "").startswith(today))
    today_challans    = sum(1 for c in challans   if c.get("created_at", "").startswith(today))
    unique_vehicles   = len(set(v.get("vehicle_number", "") for v in violations))

    try:
        total_amount = sum(
            float(c.get("amount", 0)) for c in challans if c.get("status") == "paid"
        )
    except Exception:
        total_amount = 0

    return {
        "total_violations":  total_violations,
        "total_challans":    total_challans,
        "total_detections":  total_violations,
        "total_plates":      total_violations,
        "pending_challans":  pending_challans,
        "paid_challans":     paid_challans,
        "today_violations":  today_violations,
        "today_challans":    today_challans,
        "unique_vehicles":   unique_vehicles,
        "total_amount_collected": total_amount,
    }


# ==========================
# HEALTH & ROOT
# ==========================
@app.get("/")
async def root():
    return {
        "status":  "running",
        "service": "IBSCS AI Detection API v2.0",
        "endpoints": [
            "/helmet", "/plate", "/person", "/detect_all",
            "/violations", "/save-violation",
            "/challans", "/generate-challan", "/mark-paid",
            "/stats", "/health"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
