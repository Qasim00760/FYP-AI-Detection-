import streamlit as st
import cv2
import numpy as np
import pandas as pd
import easyocr
import os
import re
import uuid
from datetime import datetime
import time
from PIL import Image


# GLOBAL CONFIGURATION
st.set_page_config(
    page_title="Integrated Bike Safety and Challan System",
    layout="wide"
)

# Custom Corporate CSS
st.markdown("""
<style>
/* === GOOGLE FONTS === */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* === GLOBAL === */
* { font-family: 'Inter', sans-serif !important; }

.stApp {
    background-color: #0A0E1A !important;
    color: #F9FAFB !important;
}

/* === SIDEBAR === */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0D1117 0%, #111827 100%) !important;
    border-right: 1px solid #374151 !important;
}

/* === METRIC CARDS === */
[data-testid="stMetric"] {
    background: #1F2937 !important;
    border: 1px solid #374151 !important;
    border-radius: 8px !important;
    padding: 16px !important;
}

[data-testid="stMetricLabel"] {
    color: #9CA3AF !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
}

[data-testid="stMetricValue"] {
    color: #F9FAFB !important;
    font-size: 1.8rem !important;
    font-weight: 700 !important;
}

/* === BUTTONS === */
.stButton > button {
    background: linear-gradient(135deg, #3B82F6, #2563EB) !important;
    color: #FFFFFF !important;
    border: none !important;
    border-radius: 6px !important;
    padding: 10px 20px !important;
    font-weight: 600 !important;
    font-size: 13px !important;
    width: 100% !important;
}

.stButton > button:hover {
    background: linear-gradient(135deg, #2563EB, #1D4ED8) !important;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

/* === INPUTS === */
.stTextInput > div > div > input,
.stNumberInput > div > div > input,
.stSelectbox > div > div {
    background: #1F2937 !important;
    border: 1px solid #374151 !important;
    border-radius: 6px !important;
    color: #F9FAFB !important;
}

/* === ALERTS === */
.stSuccess {
    background: rgba(16, 185, 129, 0.1) !important;
    border: 1px solid #10B981 !important;
    color: #10B981 !important;
}

.stError {
    background: rgba(239, 68, 68, 0.1) !important;
    border: 1px solid #EF4444 !important;
    color: #EF4444 !important;
}

.stWarning {
    background: rgba(245, 158, 11, 0.1) !important;
    border: 1px solid #F59E0B !important;
    color: #F59E0B !important;
}

.stInfo {
    background: rgba(59, 130, 246, 0.1) !important;
    border: 1px solid #3B82F6 !important;
    color: #3B82F6 !important;
}

/* === SYSTEM CARD PANEL === */
.system-card {
    background: #1F2937;
    border: 1px solid #374151;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 15px;
}
</style>
""", unsafe_allow_html=True)

# CONSTANTS AND DIRECTORY PATHS
VIOLATIONS_CSV = "data/violations.csv"
CHALLANS_CSV = "data/challans.csv"
EVIDENCE_DIR = "outputs/evidence"

os.makedirs("data", exist_ok=True)
os.makedirs("models", exist_ok=True)
os.makedirs(EVIDENCE_DIR, exist_ok=True)

# CSV INITIALIZATION
if not os.path.exists(VIOLATIONS_CSV) or os.stat(VIOLATIONS_CSV).st_size == 0:
    df_v = pd.DataFrame(columns=[
        "id", "vehicle_number", "helmet_status", "helmet_confidence",
        "ocr_confidence", "image_path", "timestamp", "source_type"
    ])
    df_v.to_csv(VIOLATIONS_CSV, index=False)

if not os.path.exists(CHALLANS_CSV) or os.stat(CHALLANS_CSV).st_size == 0:
    df_c = pd.DataFrame(columns=[
        "challan_number", "vehicle_number", "amount", "status",
        "created_at", "paid_at", "evidence_path"
    ])
    df_c.to_csv(CHALLANS_CSV, index=False)

# MOCK DETECTION MODELS
class MockBox:
    def __init__(self, xyxy, conf, cls):
        self.xyxy = [xyxy]
        self.conf = [conf]
        self.cls = [cls]

class MockResult:
    def __init__(self, boxes):
        self.boxes = boxes

class MockYOLO:
    def __init__(self, model_type):
        self.model_type = model_type
        if model_type == "helmet":
            self.names = {0: "rider", 1: "with helmet", 2: "without helmet", 3: "number plate"}
        else:
            self.names = {0: "number plate", 1: "license plate"}

    def __call__(self, image_np, verbose=False):
        h, w = image_np.shape[:2]
        boxes = []
        if self.model_type == "helmet":
            # Rider box
            boxes.append(MockBox([int(w * 0.15), int(h * 0.1), int(w * 0.85), int(h * 0.9)], 0.88, 0))
            # Violation state: without helmet
            boxes.append(MockBox([int(w * 0.35), int(h * 0.15), int(w * 0.65), int(h * 0.4)], 0.82, 2))
            # License Plate box
            boxes.append(MockBox([int(w * 0.4), int(h * 0.7), int(w * 0.6), int(h * 0.85)], 0.85, 3))
        else:
            # Plate box
            boxes.append(MockBox([int(w * 0.4), int(h * 0.7), int(w * 0.6), int(h * 0.85)], 0.85, 0))
        return [MockResult(boxes)]

class MockOCRReader:
    def readtext(self, image_np):
        return [
            ([[0, 0], [10, 0], [10, 10], [0, 10]], "LEA1234", 0.92)
        ]

# CACHED MODEL LOADING
@st.cache_resource
def load_models():
    try:
        from ultralytics import YOLO
        helmet_path = "models/helmet_detection.pt"
        plate_path = "models/number_plate_detection.pt"
        if os.path.exists(helmet_path) and os.path.exists(plate_path):
            return YOLO(helmet_path), YOLO(plate_path)
    except Exception:
        pass
    return MockYOLO("helmet"), MockYOLO("plate")

@st.cache_resource
def load_ocr():
    try:
        return easyocr.Reader(["en"], gpu=False)
    except Exception:
        pass
    return MockOCRReader()

# Load instances
helmet_model, plate_model = load_models()
ocr_reader = load_ocr()

# SESSION STATE INITIALIZATION
if "settings" not in st.session_state:
    st.session_state.settings = {
        "helmet_threshold": 70,
        "plate_threshold": 70,
        "ocr_threshold": 80,
        "fine_amount": 500.0,
        "frame_interval": 5,
        "duplicate_window_minutes": 60
    }

if "camera_running" not in st.session_state:
    st.session_state.camera_running = False

if "latest_result" not in st.session_state:
    st.session_state.latest_result = None

# CORE DATA HANDLERS
def load_csv_data(filepath):
    if not os.path.exists(filepath) or os.stat(filepath).st_size == 0:
        return pd.DataFrame()
    try:
        return pd.read_csv(filepath)
    except Exception:
        return pd.DataFrame()

def save_violation_record(vehicle_number, helmet_status, helmet_conf, ocr_conf, image_path, source_type):
    try:
        df = load_csv_data(VIOLATIONS_CSV)
        new_row = {
            "id": str(uuid.uuid4()),
            "vehicle_number": str(vehicle_number).upper(),
            "helmet_status": str(helmet_status),
            "helmet_confidence": float(helmet_conf),
            "ocr_confidence": float(ocr_conf),
            "image_path": str(image_path),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "source_type": str(source_type)
        }
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        df.to_csv(VIOLATIONS_CSV, index=False)
        return True
    except Exception as e:
        st.error(f"Error saving violation log: {e}")
        return False

def save_challan_record(challan_number, vehicle_number, amount, evidence_path):
    try:
        df = load_csv_data(CHALLANS_CSV)
        new_row = {
            "challan_number": str(challan_number),
            "vehicle_number": str(vehicle_number).upper(),
            "amount": float(amount),
            "status": "pending",
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "paid_at": "",
            "evidence_path": str(evidence_path)
        }
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        df.to_csv(CHALLANS_CSV, index=False)
        return True
    except Exception as e:
        st.error(f"Error saving challan: {e}")
        return False

def check_duplicate_violation(vehicle_number):
    try:
        df = load_csv_data(CHALLANS_CSV)
        if df.empty:
            return False, None
        df_vehicle = df[df["vehicle_number"].str.upper() == vehicle_number.upper()]
        if df_vehicle.empty:
            return False, None
        
        df_vehicle["created_at_dt"] = pd.to_datetime(df_vehicle["created_at"])
        last_record = df_vehicle.sort_values(by="created_at_dt").iloc[-1]
        time_diff = datetime.now() - last_record["created_at_dt"]
        diff_minutes = time_diff.total_seconds() / 60.0
        
        window = st.session_state.settings["duplicate_window_minutes"]
        if diff_minutes < window:
            return True, {
                "challan_number": last_record["challan_number"],
                "created_at": last_record["created_at"],
                "diff_minutes": int(diff_minutes)
            }
    except Exception:
        pass
    return False, None

def generate_challan_number():
    year = datetime.now().year
    try:
        df = load_csv_data(CHALLANS_CSV)
        if df.empty or "challan_number" not in df.columns:
            return f"IBSCS-{year}-000001"
        year_prefix = f"IBSCS-{year}-"
        df_year = df[df["challan_number"].str.startswith(year_prefix)]
        if df_year.empty:
            return f"IBSCS-{year}-000001"
        last_num_str = df_year["challan_number"].iloc[-1].split("-")[-1]
        next_num = int(last_num_str) + 1
        return f"IBSCS-{year}-{next_num:06d}"
    except Exception:
        return f"IBSCS-{year}-000001"

def save_evidence_file(image_bgr, vehicle_number):
    """Save annotated evidence image to disk and return its path."""
    try:
        evidence_dir = os.path.join("data", "evidence")
        os.makedirs(evidence_dir, exist_ok=True)
        safe_plate = re.sub(r"[^A-Za-z0-9_\-]", "_", vehicle_number)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{safe_plate}_{timestamp}.jpg"
        filepath = os.path.join(evidence_dir, filename)
        cv2.imwrite(filepath, image_bgr)
        return filepath
    except Exception as e:
        return f"evidence_save_error_{e}"


# BUSINESS LOGIC PIPELINES
def run_helmet_detection(image_np, model, threshold):
    names = model.names
    det_list = []
    
    if isinstance(model, MockYOLO):
        results = model(image_np)
    else:
        results = model(image_np, verbose=False)
        
    for box in results[0].boxes:
        conf = float(box.conf[0])
        cls_id = int(box.cls[0])
        class_name = names.get(cls_id, f"class_{cls_id}").strip().lower()
        x1, y1, x2, y2 = map(float, box.xyxy[0])
        det_list.append({
            "bbox": [x1, y1, x2, y2],
            "conf": conf,
            "class": class_name
        })
        
    filtered_dets = [d for d in det_list if d["conf"] >= (threshold / 100.0)]
    
    # False Detection Override Logic
    with_helmet_dets = [d for d in filtered_dets if d["class"] == "with helmet"]
    without_helmet_dets = [d for d in filtered_dets if d["class"] == "without helmet"]
    
    max_with_conf = max(d["conf"] for d in with_helmet_dets) if with_helmet_dets else 0.0
    max_without_conf = max(d["conf"] for d in without_helmet_dets) if without_helmet_dets else 0.0
    
    helmet_violation = False
    helmet_status = "with helmet"
    helmet_confidence = 0.0
    
    if max_with_conf > 0.0 or max_without_conf > 0.0:
        if max_with_conf >= max_without_conf:
            helmet_violation = False
            helmet_status = "with helmet"
            helmet_confidence = max_with_conf
        else:
            helmet_violation = True
            helmet_status = "without helmet"
            helmet_confidence = max_without_conf
            
    rider_detected = any(d["class"] == "rider" for d in filtered_dets)
    
    return {
        "helmet_violation": helmet_violation,
        "helmet_status": helmet_status,
        "helmet_confidence": helmet_confidence,
        "rider_detected": rider_detected,
        "detections": filtered_dets
    }

def run_plate_detection(image_np, model, threshold):
    names = model.names
    best_plate = None
    
    if isinstance(model, MockYOLO):
        results = model(image_np)
    else:
        results = model(image_np, verbose=False)
        
    for box in results[0].boxes:
        conf = float(box.conf[0])
        if conf < (threshold / 100.0):
            continue
        cls_id = int(box.cls[0])
        class_name = names.get(cls_id, f"class_{cls_id}").strip().lower()
        
        # Handle variations interchangeably
        if class_name in ["number plate", "license plate"]:
            if best_plate is None or conf > best_plate["conf"]:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                best_plate = {
                    "bbox": [x1, y1, x2, y2],
                    "conf": conf
                }
                
    if best_plate:
        h, w = image_np.shape[:2]
        x1, y1, x2, y2 = best_plate["bbox"]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        plate_crop = image_np[y1:y2, x1:x2]
        return {
            "plate_detected": True,
            "plate_bbox": [x1, y1, x2, y2],
            "plate_confidence": best_plate["conf"],
            "plate_crop": plate_crop
        }
    return {
        "plate_detected": False,
        "plate_bbox": None,
        "plate_confidence": 0.0,
        "plate_crop": None
    }

def run_ocr(plate_crop, reader, threshold):
    if reader is None or plate_crop is None or plate_crop.size == 0:
        return {
            "plate_text": "UNKNOWN",
            "ocr_confidence": 0.0,
            "ocr_success": False
        }
    try:
        if len(plate_crop.shape) == 3 and plate_crop.shape[2] == 3:
            gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
        else:
            gray = plate_crop.copy()
            
        resized = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
        filtered = cv2.bilateralFilter(resized, 11, 17, 17)
        thresh = cv2.adaptiveThreshold(filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY, 11, 2)
                                    
        ocr_results = reader.readtext(thresh)
        best_text = ""
        best_conf = 0.0
        
        for res in ocr_results:
            text = res[1]
            conf = float(res[2])
            clean_text = "".join(c for c in text.upper() if c.isalnum())
            if clean_text and conf > best_conf:
                best_text = clean_text
                best_conf = conf
                
        if best_conf >= (threshold / 100.0):
            return {
                "plate_text": best_text,
                "ocr_confidence": best_conf,
                "ocr_success": True
            }
        return {
            "plate_text": best_text if best_text else "UNKNOWN",
            "ocr_confidence": best_conf,
            "ocr_success": False
        }
    except Exception:
        return {
            "plate_text": "UNKNOWN",
            "ocr_confidence": 0.0,
            "ocr_success": False
        }

def draw_annotations(image_np, helmet_results, plate_results):
    annotated = image_np.copy()
    
    # Draw helmet model outputs
    for det in helmet_results.get("detections", []):
        x1, y1, x2, y2 = map(int, det["bbox"])
        cls_name = det["class"]
        
        if cls_name == "without helmet":
            color = (0, 0, 255)  # Red BGR
            label = f"Violation: {det['conf']:.2f}"
        elif cls_name == "with helmet":
            color = (0, 255, 0)  # Green BGR
            label = f"Safe: {det['conf']:.2f}"
        elif cls_name == "rider":
            color = (0, 255, 255)  # Yellow BGR
            label = f"Rider: {det['conf']:.2f}"
        else:
            color = (255, 0, 0)  # Blue BGR
            label = f"Plate: {det['conf']:.2f}"
            
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        cv2.putText(annotated, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
    # Draw plate model outputs
    if plate_results.get("plate_detected"):
        x1, y1, x2, y2 = map(int, plate_results["plate_bbox"])
        color = (255, 0, 0)  # Blue BGR
        label = f"Plate: {plate_results['plate_confidence']:.2f}"
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        cv2.putText(annotated, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
    return annotated

def check_challan_eligibility(helmet_status, plate_detected, ocr_confidence, ocr_threshold):
    if helmet_status == "without helmet" and plate_detected and (ocr_confidence * 100) >= ocr_threshold:
        return True
    return False

# STATIC SIMULATION FRAME GENERATOR
def get_mock_frame(frame_count):
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(frame, (0, 300), (640, 480), (45, 45, 45), -1)
    cv2.rectangle(frame, (0, 0), (640, 300), (85, 40, 10), -1)
    cv2.rectangle(frame, (220, 240), (420, 390), (100, 100, 100), -1)
    cv2.putText(frame, f"Simulated Frame {frame_count}", (15, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (240, 240, 240), 2)
    return frame

# SIDEBAR NAVIGATION
st.sidebar.markdown("<h2 style='text-align: center; color: #3B82F6;'>IBSCS Control</h2>", unsafe_allow_html=True)
st.sidebar.markdown("<p style='text-align: center; font-size: 0.8rem; color: #9CA3AF;'>Integrated Bike Safety & Challan System</p>", unsafe_allow_html=True)
st.sidebar.markdown("---")

page = st.sidebar.selectbox("Select System Interface", [
    "Dashboard",
    "Image Detection",
    "Live Camera Detection",
    "Challans",
    "Violations",
    "Settings"
])

# 1. DASHBOARD PAGE
if page == "Dashboard":
    st.markdown("<h2>System Dashboard</h2>", unsafe_allow_html=True)
    st.markdown("---")
    
    df_violations = load_csv_data(VIOLATIONS_CSV)
    df_challans = load_csv_data(CHALLANS_CSV)
    
    total_violations = len(df_violations)
    total_challans = len(df_challans)
    
    pending_challans = 0
    paid_challans = 0
    if not df_challans.empty:
        pending_challans = len(df_challans[df_challans["status"] == "pending"])
        paid_challans = len(df_challans[df_challans["status"] == "paid"])
        
    unique_vehicles = 0
    if not df_violations.empty:
        unique_vehicles = df_violations["vehicle_number"].nunique()
        
    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.metric("Total Violations", total_violations)
    with col2:
        st.metric("Total Challans", total_challans)
    with col3:
        st.metric("Pending Challans", pending_challans)
    with col4:
        st.metric("Paid Challans", paid_challans)
    with col5:
        st.metric("Unique Vehicles", unique_vehicles)
        
    st.markdown("<br>", unsafe_allow_html=True)
    
    col_t1, col_t2 = st.columns(2)
    with col_t1:
        st.markdown("### Recent Violations Table")
        if df_violations.empty:
            st.info("No violation records available.")
        else:
            df_v_show = df_violations.tail(10).copy()
            df_v_show = df_v_show[["vehicle_number", "helmet_status", "timestamp", "source_type"]]
            st.dataframe(df_v_show, use_container_width=True)
            
    with col_t2:
        st.markdown("### Recent Challans Table")
        if df_challans.empty:
            st.info("No challan records available.")
        else:
            df_c_show = df_challans.tail(10).copy()
            df_c_show = df_c_show[["challan_number", "vehicle_number", "amount", "status", "created_at"]]
            st.dataframe(df_c_show, use_container_width=True)

# 2. IMAGE DETECTION PAGE
elif page == "Image Detection":
    st.markdown("<h2>Image Detection Workflow</h2>", unsafe_allow_html=True)
    st.markdown("---")
    
    uploaded_file = st.file_uploader("Upload Vehicle Image File", type=["jpg", "jpeg", "png"])
    
    if uploaded_file is not None:
        pil_image = Image.open(uploaded_file)
        img_np = np.array(pil_image)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        
        # Run detection
        with st.spinner("Executing model inference pipeline..."):
            helmet_res = run_helmet_detection(img_bgr, helmet_model, st.session_state.settings["helmet_threshold"])
            plate_res = run_plate_detection(img_bgr, plate_model, st.session_state.settings["plate_threshold"])
            
            ocr_res = {"plate_text": "UNKNOWN", "ocr_confidence": 0.0, "ocr_success": False}
            if plate_res["plate_detected"]:
                ocr_res = run_ocr(plate_res["plate_crop"], ocr_reader, st.session_state.settings["ocr_threshold"])
                
            annotated_img = draw_annotations(img_bgr, helmet_res, plate_res)
            
            is_eligible = check_challan_eligibility(
                helmet_res["helmet_status"],
                plate_res["plate_detected"],
                ocr_res["ocr_confidence"],
                st.session_state.settings["ocr_threshold"]
            )
            
            st.session_state.latest_result = {
                "frame": img_bgr.copy(),
                "helmet": helmet_res,
                "plate": plate_res,
                "ocr": ocr_res,
                "eligible": is_eligible,
                "annotated": annotated_img
            }
            
        # UI Display
        col_img1, col_img2 = st.columns(2)
        with col_img1:
            st.image(uploaded_file, caption="Original Image Output", use_container_width=True)
        with col_img2:
            annotated_rgb = cv2.cvtColor(annotated_img, cv2.COLOR_BGR2RGB)
            st.image(annotated_rgb, caption="Annotated Inference Output", use_container_width=True)
            
        # Status details panel
        st.markdown("<div class='system-card'>", unsafe_allow_html=True)
        st.markdown("### Technical Inference Panel")
        col_d1, col_d2, col_d3 = st.columns(3)
        with col_d1:
            st.markdown(f"**Helmet Status:** {helmet_res['helmet_status'].upper()}")
            st.markdown(f"**Helmet Model Confidence:** {helmet_res['helmet_confidence']:.2f}")
        with col_d2:
            st.markdown(f"**Plate Detected:** {plate_res['plate_detected']}")
            st.markdown(f"**OCR String Output:** {ocr_res['plate_text']}")
        with col_d3:
            st.markdown(f"**OCR Model Confidence:** {ocr_res['ocr_confidence']:.2f}")
            st.markdown(f"**Challan Eligibility:** {is_eligible}")
        st.markdown("</div>", unsafe_allow_html=True)
        
        # Manual verification / action form
        if is_eligible:
            st.warning("Vehicle complies with regulations or has low confidence scores. Verification is required.")
            corrected_plate = st.text_input("Manual License Plate Correction", value=ocr_res["plate_text"])
            
            # Duplicate check
            is_dup, dup_info = check_duplicate_violation(corrected_plate)
            if is_dup:
                st.error(f"Duplicate warning: Ticket {dup_info['challan_number']} was issued {dup_info['diff_minutes']} minutes ago.")
                
            if st.button("Generate Challan"):
                challan_num = generate_challan_number()
                evidence_path = save_evidence_file(img_bgr, corrected_plate)
                
                # Append to Violations CSV
                save_violation_record(
                    vehicle_number=corrected_plate,
                    helmet_status=helmet_res["helmet_status"],
                    helmet_conf=helmet_res["helmet_confidence"],
                    ocr_conf=ocr_res["ocr_confidence"],
                    image_path=evidence_path,
                    source_type="Image Upload"
                )
                
                # Append to Challans CSV
                save_challan_record(
                    challan_number=challan_num,
                    vehicle_number=corrected_plate,
                    amount=st.session_state.settings["fine_amount"],
                    evidence_path=evidence_path
                )
                st.success(f"Challan {challan_num} successfully generated and logged.")
        else:
            st.info("Vehicle complies with regulations or has low confidence scores. Violation logging is bypassed.")

# 3. LIVE CAMERA DETECTION PAGE
elif page == "Live Camera Detection":
    st.markdown("<h2>Live Camera Detection</h2>", unsafe_allow_html=True)
    st.markdown("---")
    
    camera_mode = st.selectbox("Select Feed Input Source", [
        "Local Webcam (OpenCV)",
        "Browser Camera Input (st.camera_input)",
        "Static Stream Simulation"
    ])
    
    # Session state for camera feed outputs
    if "live_plate_number" not in st.session_state:
        st.session_state.live_plate_number = "UNKNOWN"
    if "live_ocr_confidence" not in st.session_state:
        st.session_state.live_ocr_confidence = 0.0
    if "live_helmet_status" not in st.session_state:
        st.session_state.live_helmet_status = "with helmet"
    if "live_helmet_confidence" not in st.session_state:
        st.session_state.live_helmet_confidence = 0.0
    if "live_plate_detected" not in st.session_state:
        st.session_state.live_plate_detected = False
    if "live_eligible" not in st.session_state:
        st.session_state.live_eligible = False
    if "live_annotated_frame" not in st.session_state:
        st.session_state.live_annotated_frame = None
    if "live_original_frame" not in st.session_state:
        st.session_state.live_original_frame = None
        
    # BROWSER CAMERA INPUT MODE
    if camera_mode == "Browser Camera Input (st.camera_input)":
        captured_file = st.camera_input("Browser camera feed")
        if captured_file is not None:
            pil_image = Image.open(captured_file)
            img_np = np.array(pil_image)
            img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
            
            with st.spinner("Processing snapshot..."):
                t_start = time.time()
                helmet_res = run_helmet_detection(img_bgr, helmet_model, st.session_state.settings["helmet_threshold"])
                
                plate_res = {"plate_detected": False}
                ocr_res = {"plate_text": "UNKNOWN", "ocr_confidence": 0.0, "ocr_success": False}
                
                # EasyOCR check runs only if violation state AND plate detected simultaneously
                if helmet_res["helmet_violation"]:
                    plate_res = run_plate_detection(img_bgr, plate_model, st.session_state.settings["plate_threshold"])
                    if plate_res["plate_detected"]:
                        ocr_res = run_ocr(plate_res["plate_crop"], ocr_reader, st.session_state.settings["ocr_threshold"])
                        
                annotated_img = draw_annotations(img_bgr, helmet_res, plate_res)
                elapsed = time.time() - t_start
                
                is_eligible = check_challan_eligibility(
                    helmet_res["helmet_status"],
                    plate_res["plate_detected"],
                    ocr_res["ocr_confidence"],
                    st.session_state.settings["ocr_threshold"]
                )
                
                st.session_state.live_plate_number = ocr_res["plate_text"]
                st.session_state.live_ocr_confidence = ocr_res["ocr_confidence"]
                st.session_state.live_helmet_status = helmet_res["helmet_status"]
                st.session_state.live_helmet_confidence = helmet_res["helmet_confidence"]
                st.session_state.live_plate_detected = plate_res["plate_detected"]
                st.session_state.live_eligible = is_eligible
                st.session_state.live_annotated_frame = annotated_img
                st.session_state.live_original_frame = img_bgr
                
            st.image(cv2.cvtColor(annotated_img, cv2.COLOR_BGR2RGB), use_container_width=True)
            st.metric("Processing Latency (ms)", f"{elapsed * 1000:.0f}")

    # LOCAL WEBCAM (OPENCV) MODE
    elif camera_mode == "Local Webcam (OpenCV)":
        col_btn1, col_btn2 = st.columns(2)
        with col_btn1:
            if st.button("Start Local Webcam Feed", type="primary"):
                st.session_state.camera_running = True
                st.rerun()
        with col_btn2:
            if st.button("Stop Local Webcam Feed"):
                st.session_state.camera_running = False
                st.rerun()
                
        frame_placeholder = st.empty()
        
        if st.session_state.camera_running:
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                st.error("Failed to connect to local webcam. Check permissions.")
                st.session_state.camera_running = False
            else:
                frame_count = 0
                settings = st.session_state.settings
                
                # Set dummy defaults
                last_helmet_results = {"helmet_violation": False, "helmet_status": "with helmet", "helmet_confidence": 0.0, "detections": []}
                last_plate_results = {"plate_detected": False}
                last_ocr_results = {"plate_text": "UNKNOWN", "ocr_confidence": 0.0}
                
                while st.session_state.camera_running:
                    t_start = time.time()
                    ret, frame = cap.read()
                    if not ret:
                        st.warning("Failed to retrieve frames from video source stream.")
                        break
                    
                    frame_count += 1
                    
                    # YOLO logic runs on every N-th frame
                    if frame_count % settings["frame_interval"] == 0:
                        helmet_results = run_helmet_detection(frame, helmet_model, settings["helmet_threshold"])
                        last_helmet_results = helmet_results
                        
                        # Run EasyOCR only if helmet violation and plate are detected
                        if helmet_results["helmet_violation"]:
                            plate_results = run_plate_detection(frame, plate_model, settings["plate_threshold"])
                            last_plate_results = plate_results
                            if plate_results["plate_detected"]:
                                ocr_results = run_ocr(plate_results["plate_crop"], ocr_reader, settings["ocr_threshold"])
                                last_ocr_results = ocr_results
                                
                                st.session_state.live_plate_number = ocr_results["plate_text"]
                                st.session_state.live_ocr_confidence = ocr_results["ocr_confidence"]
                                st.session_state.live_helmet_status = helmet_results["helmet_status"]
                                st.session_state.live_helmet_confidence = helmet_results["helmet_confidence"]
                                st.session_state.live_plate_detected = plate_results["plate_detected"]
                                st.session_state.live_original_frame = frame.copy()
                                st.session_state.live_eligible = check_challan_eligibility(
                                    helmet_results["helmet_status"],
                                    plate_results["plate_detected"],
                                    ocr_results["ocr_confidence"],
                                    settings["ocr_threshold"]
                                )
                        else:
                            last_plate_results = {"plate_detected": False}
                            last_ocr_results = {"plate_text": "UNKNOWN", "ocr_confidence": 0.0}
                            
                    annotated_frame = draw_annotations(frame, last_helmet_results, last_plate_results)
                    st.session_state.live_annotated_frame = annotated_frame
                    
                    # Convert color space for Streamlit
                    frame_rgb = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
                    frame_placeholder.image(frame_rgb, use_container_width=True)
                    
                    elapsed = time.time() - t_start
                    time.sleep(0.01)
                cap.release()

    # STATIC STREAM SIMULATION MODE
    elif camera_mode == "Static Stream Simulation":
        col_s1, col_s2 = st.columns(2)
        with col_s1:
            if st.button("Start Static Stream Simulation", type="primary"):
                st.session_state.camera_running = True
                st.rerun()
        with col_s2:
            if st.button("Stop Static Stream Simulation"):
                st.session_state.camera_running = False
                st.rerun()
                
        frame_placeholder = st.empty()
        
        if st.session_state.camera_running:
            frame_count = 0
            settings = st.session_state.settings
            
            while st.session_state.camera_running:
                t_start = time.time()
                frame = get_mock_frame(frame_count)
                frame_count += 1
                
                if frame_count % settings["frame_interval"] == 0:
                    helmet_results = run_helmet_detection(frame, helmet_model, settings["helmet_threshold"])
                    plate_results = run_plate_detection(frame, plate_model, settings["plate_threshold"])
                    
                    # Run OCR ONLY if helmet violation AND plate detected simultaneously
                    ocr_results = {"plate_text": "UNKNOWN", "ocr_confidence": 0.0}
                    if helmet_results["helmet_violation"] and plate_results["plate_detected"]:
                        ocr_results = run_ocr(plate_results["plate_crop"], ocr_reader, settings["ocr_threshold"])
                        
                    is_eligible = check_challan_eligibility(
                        helmet_results["helmet_status"],
                        plate_results["plate_detected"],
                        ocr_results["ocr_confidence"],
                        settings["ocr_threshold"]
                    )
                    
                    st.session_state.live_plate_number = ocr_results["plate_text"]
                    st.session_state.live_ocr_confidence = ocr_results["ocr_confidence"]
                    st.session_state.live_helmet_status = helmet_results["helmet_status"]
                    st.session_state.live_helmet_confidence = helmet_results["helmet_confidence"]
                    st.session_state.live_plate_detected = plate_results["plate_detected"]
                    st.session_state.live_eligible = is_eligible
                    st.session_state.live_original_frame = frame.copy()
                    
                annotated_frame = draw_annotations(frame, helmet_results, plate_results)
                st.session_state.live_annotated_frame = annotated_frame
                
                frame_placeholder.image(cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB), use_container_width=True)
                elapsed = time.time() - t_start
                time.sleep(0.1)
                
    # Shared info panel and verification panel
    st.markdown("<div class='system-card'>", unsafe_allow_html=True)
    st.markdown("### Live Operations Dashboard")
    col_l1, col_l2, col_l3 = st.columns(3)
    with col_l1:
        st.markdown(f"**Helmet Status:** {st.session_state.live_helmet_status.upper()}")
        st.markdown(f"**Helmet Confidence:** {st.session_state.live_helmet_confidence:.2f}")
    with col_l2:
        st.markdown(f"**Plate Detected:** {st.session_state.live_plate_detected}")
        st.markdown(f"**OCR String:** {st.session_state.live_plate_number}")
    with col_l3:
        st.markdown(f"**OCR Confidence:** {st.session_state.live_ocr_confidence:.2f}")
        st.markdown(f"**Enforcement Eligible:** {st.session_state.live_eligible}")
    st.markdown("</div>", unsafe_allow_html=True)
    
    if st.session_state.live_eligible and st.session_state.live_original_frame is not None:
        st.warning("Safety violation flagged. Operator review requested.")
        live_corrected_plate = st.text_input("Verify Vehicle Registration Number", value=st.session_state.live_plate_number, key="live_verif_plate")
        
        # Duplicate check
        is_dup, dup_info = check_duplicate_violation(live_corrected_plate)
        if is_dup:
            st.error(f"Duplicate warning: Ticket {dup_info['challan_number']} was issued {dup_info['diff_minutes']} minutes ago.")
            
        if st.button("Generate Challan for Current Frame"):
            challan_num = generate_challan_number()
            evidence_path = save_evidence_file(st.session_state.live_original_frame, live_corrected_plate)
            
            # Save violation log
            save_violation_record(
                vehicle_number=live_corrected_plate,
                helmet_status=st.session_state.live_helmet_status,
                helmet_conf=st.session_state.live_helmet_confidence,
                ocr_conf=st.session_state.live_ocr_confidence,
                image_path=evidence_path,
                source_type="Live Stream"
            )
            
            # Save challan log
            save_challan_record(
                challan_number=challan_num,
                vehicle_number=live_corrected_plate,
                amount=st.session_state.settings["fine_amount"],
                evidence_path=evidence_path
            )
            st.success(f"Challan {challan_num} successfully generated.")
            st.session_state.live_eligible = False

# 4. CHALLANS PAGE
elif page == "Challans":
    st.markdown("<h2>Challan Management</h2>", unsafe_allow_html=True)
    st.markdown("---")
    
    df_challans = load_csv_data(CHALLANS_CSV)
    
    if df_challans.empty:
        st.info("No challans found in the logs database.")
    else:
        # Payor interface panel
        pending_challans = df_challans[df_challans["status"] == "pending"]
        
        if not pending_challans.empty:
            st.markdown("<div class='system-card'>", unsafe_allow_html=True)
            st.markdown("### Update Challan Status")
            target_challan = st.selectbox("Select Pending Challan Number", pending_challans["challan_number"].tolist())
            
            # Retrieve information
            challan_row = pending_challans[pending_challans["challan_number"] == target_challan].iloc[0]
            st.markdown(f"**Vehicle Registration Number:** {challan_row['vehicle_number']} | **Fine Amount:** Rs. {challan_row['amount']} | **Issued Date:** {challan_row['created_at']}")
            
            if st.button("Mark as Paid", type="primary"):
                df_challans.loc[df_challans["challan_number"] == target_challan, "status"] = "paid"
                df_challans.loc[df_challans["challan_number"] == target_challan, "paid_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                df_challans.to_csv(CHALLANS_CSV, index=False)
                st.success(f"Challan {target_challan} updated to Paid.")
                time.sleep(1)
                st.rerun()
            st.markdown("</div>", unsafe_allow_html=True)
        else:
            st.success("All issued challans have been paid.")
            
        st.markdown("### Database Entries")
        st.dataframe(df_challans, use_container_width=True)

# 5. VIOLATIONS PAGE
elif page == "Violations":
    st.markdown("<h2>Violation Log Database</h2>", unsafe_allow_html=True)
    st.markdown("---")
    
    df_violations = load_csv_data(VIOLATIONS_CSV)
    
    if df_violations.empty:
        st.info("No violation records located.")
    else:
        st.dataframe(df_violations, use_container_width=True)

# 6. SETTINGS PAGE
elif page == "Settings":
    st.markdown("<h2>System Settings</h2>", unsafe_allow_html=True)
    st.markdown("---")
    
    with st.form("settings_form"):
        st.markdown("### Detection Settings")
        h_threshold = st.slider("Helmet Detection Confidence Threshold (%)", 50, 95, st.session_state.settings["helmet_threshold"])
        p_threshold = st.slider("Plate Detection Confidence Threshold (%)", 50, 95, st.session_state.settings["plate_threshold"])
        o_threshold = st.slider("OCR Confidence Threshold (%)", 60, 95, st.session_state.settings["ocr_threshold"])
        
        st.markdown("---")
        st.markdown("### Challan Settings")
        f_amount = st.number_input("Standard Fine Amount (Rs.)", 100, 10000, int(st.session_state.settings["fine_amount"]))
        d_window = st.slider("Duplicate Window Intercept (minutes)", 5, 120, st.session_state.settings["duplicate_window_minutes"])
        
        st.markdown("---")
        st.markdown("### Performance Settings")
        f_interval = st.slider("Video Processing Frame Interval (N)", 1, 15, st.session_state.settings["frame_interval"])
        
        save_btn = st.form_submit_button("Save Configurations")
        
        if save_btn:
            st.session_state.settings = {
                "helmet_threshold": h_threshold,
                "plate_threshold": p_threshold,
                "ocr_threshold": o_threshold,
                "fine_amount": float(f_amount),
                "frame_interval": f_interval,
                "duplicate_window_minutes": d_window
            }
            st.success("Configurations updated successfully.")