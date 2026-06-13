import streamlit as st
import cv2
import numpy as np
import pandas as pd
import easyocr
import os
import uuid
from ultralytics import YOLO
from PIL import Image
from datetime import datetime, date
import time

st.set_page_config(
    page_title="IBSCS - Bike Safety System",
    page_icon="🚴",
    layout="wide"
)

# ==========================
# CONSTANTS & PATHS
# ==========================
VIOLATIONS_CSV = "data/violations.csv"
CHALLANS_CSV   = "data/challans.csv"
EVIDENCE_DIR   = "outputs/evidence"

os.makedirs("data", exist_ok=True)
os.makedirs(EVIDENCE_DIR, exist_ok=True)

# ==========================
# CSV INITIALIZATION
# ==========================
def init_csv():
    if not os.path.exists(VIOLATIONS_CSV):
        pd.DataFrame(columns=[
            "id", "vehicle_number", "helmet_status", "helmet_confidence",
            "ocr_confidence", "image_path", "timestamp", "source_type"
        ]).to_csv(VIOLATIONS_CSV, index=False)

    if not os.path.exists(CHALLANS_CSV):
        pd.DataFrame(columns=[
            "challan_number", "vehicle_number", "amount", "status",
            "created_at", "paid_at", "evidence_path"
        ]).to_csv(CHALLANS_CSV, index=False)

init_csv()

# ==========================
# SETTINGS
# ==========================
if "settings" not in st.session_state:
    st.session_state.settings = {
        "helmet_threshold": 70,
        "plate_threshold": 70,
        "ocr_threshold": 80,
        "fine_amount": 500,
        "frame_interval": 5,
        "duplicate_window_minutes": 60
    }

if "camera_running" not in st.session_state:
    st.session_state.camera_running = False

if "latest_result" not in st.session_state:
    st.session_state.latest_result = None

# ==========================
# MODEL LOADING
# ==========================
@st.cache_resource
def load_models():
    helmet_path = "models/helmet_detection.pt"
    plate_path  = "models/number_plate_detection.pt"
    helmet_model = YOLO(helmet_path) if os.path.exists(helmet_path) else None
    plate_model  = YOLO(plate_path)  if os.path.exists(plate_path)  else None
    return helmet_model, plate_model

@st.cache_resource
def load_ocr():
    return easyocr.Reader(["en"], gpu=False)

# ==========================
# DETECTION FUNCTIONS
# ==========================
def run_helmet_detection(image_np, helmet_model):
    settings = st.session_state.settings
    threshold = settings["helmet_threshold"] / 100.0

    if helmet_model is None:
        return {
            "helmet_violation": False, "helmet_status": "Model Not Loaded",
            "helmet_confidence": 0.0, "rider_detected": False, "detections": []
        }

    try:
        h, w = image_np.shape[:2]
        max_w = 960
        if w > max_w:
            scale = max_w / w
            image_np = cv2.resize(image_np, (max_w, int(h * scale)))

        results = helmet_model(image_np, verbose=False)[0]
        detections = []
        with_helmet_conf    = 0.0
        without_helmet_conf = 0.0
        rider_detected      = False

        for box in results.boxes:
            conf   = float(box.conf[0])
            cls_id = int(box.cls[0])
            label  = helmet_model.names.get(cls_id, str(cls_id)).lower().strip()
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            if conf < threshold:
                continue

            detections.append({
                "label": label, "confidence": conf,
                "bbox": [x1, y1, x2, y2]
            })

            if "without" in label or "no helmet" in label:
                without_helmet_conf = max(without_helmet_conf, conf)
            elif "with" in label or label == "helmet":
                with_helmet_conf = max(with_helmet_conf, conf)
            elif "rider" in label or "person" in label:
                rider_detected = True

        # False detection rule: use higher confidence
        if with_helmet_conf > 0 and without_helmet_conf > 0:
            helmet_violation = without_helmet_conf > with_helmet_conf
            if helmet_violation:
                helmet_status = "Without Helmet"
                helmet_conf   = without_helmet_conf
            else:
                helmet_status = "With Helmet"
                helmet_conf   = with_helmet_conf
        elif without_helmet_conf > 0:
            helmet_violation = True
            helmet_status    = "Without Helmet"
            helmet_conf      = without_helmet_conf
        elif with_helmet_conf > 0:
            helmet_violation = False
            helmet_status    = "With Helmet"
            helmet_conf      = with_helmet_conf
        else:
            helmet_violation = False
            helmet_status    = "No Rider Detected"
            helmet_conf      = 0.0

        return {
            "helmet_violation": helmet_violation,
            "helmet_status":    helmet_status,
            "helmet_confidence": helmet_conf,
            "rider_detected":   rider_detected,
            "detections":       detections
        }

    except Exception as e:
        return {
            "helmet_violation": False, "helmet_status": f"Error: {e}",
            "helmet_confidence": 0.0, "rider_detected": False, "detections": []
        }


def run_plate_detection(image_np, plate_model):
    settings  = st.session_state.settings
    threshold = settings["plate_threshold"] / 100.0

    if plate_model is None:
        return {
            "plate_detected": False, "plate_bbox": None,
            "plate_confidence": 0.0, "plate_crop": None
        }

    try:
        results = plate_model(image_np, verbose=False)[0]
        best_conf = 0.0
        best_bbox = None
        best_crop = None

        for box in results.boxes:
            conf   = float(box.conf[0])
            cls_id = int(box.cls[0])
            label  = plate_model.names.get(cls_id, str(cls_id)).lower().strip()

            plate_keywords = ["number plate", "license plate", "license_plate", "plate", "numberplate"]
            is_plate = any(kw in label for kw in plate_keywords)

            if not is_plate or conf < threshold:
                continue

            if conf > best_conf:
                best_conf = conf
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                best_bbox = [x1, y1, x2, y2]
                crop = image_np[max(0, y1):y2, max(0, x1):x2]
                best_crop = crop if crop.size > 0 else None

        return {
            "plate_detected":   best_bbox is not None,
            "plate_bbox":       best_bbox,
            "plate_confidence": best_conf,
            "plate_crop":       best_crop
        }

    except Exception as e:
        return {
            "plate_detected": False, "plate_bbox": None,
            "plate_confidence": 0.0, "plate_crop": None
        }


def run_ocr(plate_crop, ocr_reader):
    settings  = st.session_state.settings
    threshold = settings["ocr_threshold"] / 100.0

    if plate_crop is None or plate_crop.size == 0:
        return {"plate_text": "", "ocr_confidence": 0.0, "ocr_success": False}

    try:
        results   = ocr_reader.readtext(plate_crop)
        best_text = ""
        best_conf = 0.0

        for (_, text, conf) in results:
            if conf >= threshold and conf > best_conf:
                cleaned = "".join(c for c in text.upper() if c.isalnum())
                if cleaned:
                    best_text = cleaned
                    best_conf = conf

        return {
            "plate_text":      best_text,
            "ocr_confidence":  best_conf,
            "ocr_success":     bool(best_text)
        }

    except Exception as e:
        return {"plate_text": "", "ocr_confidence": 0.0, "ocr_success": False}


def draw_annotations(image_np, helmet_results, plate_results=None):
    img = image_np.copy()

    color_map = {
        "with helmet":    (0, 255, 0),
        "helmet":         (0, 255, 0),
        "without helmet": (0, 0, 255),
        "no helmet":      (0, 0, 255),
        "rider":          (0, 255, 255),
        "person":         (0, 255, 255),
    }
    default_color = (200, 200, 200)

    for det in helmet_results.get("detections", []):
        x1, y1, x2, y2 = det["bbox"]
        label = det["label"]
        conf  = det["confidence"]

        color = default_color
        for key, val in color_map.items():
            if key in label:
                color = val
                break

        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        text = f"{label} {conf*100:.1f}%"
        (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(img, (x1, max(0, y1 - th - 8)), (x1 + tw + 4, y1), color, -1)
        cv2.putText(img, text, (x1 + 2, max(th, y1 - 4)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)

    if plate_results and plate_results.get("plate_detected") and plate_results.get("plate_bbox"):
        x1, y1, x2, y2 = plate_results["plate_bbox"]
        color = (255, 165, 0)
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        text = f"Plate {plate_results['plate_confidence']*100:.1f}%"
        (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(img, (x1, max(0, y1 - th - 8)), (x1 + tw + 4, y1), color, -1)
        cv2.putText(img, text, (x1 + 2, max(th, y1 - 4)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)

    return img


def check_challan_eligibility(helmet_results, plate_results, ocr_results):
    settings = st.session_state.settings
    ocr_thr  = settings["ocr_threshold"] / 100.0

    if not helmet_results.get("helmet_violation"):
        return {"eligible": False, "reason": "No helmet violation detected."}
    if not plate_results or not plate_results.get("plate_detected"):
        return {"eligible": False, "reason": "Number plate not detected."}
    if not ocr_results or ocr_results.get("ocr_confidence", 0) < ocr_thr:
        return {
            "eligible": False,
            "reason": f"OCR confidence {ocr_results.get('ocr_confidence',0)*100:.1f}% is below threshold {settings['ocr_threshold']}%."
        }
    return {"eligible": True, "reason": "All conditions met. Challan can be generated."}


def generate_challan_number():
    year = datetime.now().year
    try:
        if os.path.exists(CHALLANS_CSV):
            df = pd.read_csv(CHALLANS_CSV)
            if not df.empty and "challan_number" in df.columns:
                last = df["challan_number"].iloc[-1]
                num  = int(last.split("-")[-1]) + 1
            else:
                num = 1
        else:
            num = 1
    except Exception:
        num = 1
    return f"IBSCS-{year}-{num:06d}"


def save_violation(vehicle_number, helmet_status, helmet_conf, ocr_conf, image_path, source_type):
    try:
        row = {
            "id":               str(uuid.uuid4())[:8],
            "vehicle_number":   vehicle_number,
            "helmet_status":    helmet_status,
            "helmet_confidence": round(helmet_conf * 100, 2),
            "ocr_confidence":   round(ocr_conf * 100, 2),
            "image_path":       image_path,
            "timestamp":        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "source_type":      source_type
        }
        df = pd.read_csv(VIOLATIONS_CSV) if os.path.exists(VIOLATIONS_CSV) else pd.DataFrame()
        df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
        df.to_csv(VIOLATIONS_CSV, index=False)
    except Exception as e:
        st.error(f"Error saving violation: {e}")


def save_challan(challan_number, vehicle_number, amount, evidence_path):
    try:
        row = {
            "challan_number": challan_number,
            "vehicle_number": vehicle_number,
            "amount":         amount,
            "status":         "pending",
            "created_at":     datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "paid_at":        "",
            "evidence_path":  evidence_path
        }
        df = pd.read_csv(CHALLANS_CSV) if os.path.exists(CHALLANS_CSV) else pd.DataFrame()
        df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
        df.to_csv(CHALLANS_CSV, index=False)
    except Exception as e:
        st.error(f"Error saving challan: {e}")


def save_evidence(image_np, vehicle_number):
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = "".join(c for c in vehicle_number if c.isalnum()) or "UNKNOWN"
        filename  = f"{safe_name}_{timestamp}.jpg"
        filepath  = os.path.join(EVIDENCE_DIR, filename)
        cv2.imwrite(filepath, image_np)
        return filepath
    except Exception as e:
        return ""


def load_violations():
    try:
        if os.path.exists(VIOLATIONS_CSV):
            df = pd.read_csv(VIOLATIONS_CSV)
            return df if not df.empty else pd.DataFrame()
        return pd.DataFrame()
    except Exception:
        return pd.DataFrame()


def load_challans():
    try:
        if os.path.exists(CHALLANS_CSV):
            df = pd.read_csv(CHALLANS_CSV)
            return df if not df.empty else pd.DataFrame()
        return pd.DataFrame()
    except Exception:
        return pd.DataFrame()


# ==========================
# SIDEBAR NAVIGATION
# ==========================
st.sidebar.title("🚴 IBSCS")
st.sidebar.markdown("**AI-Assisted Helmet Violation Detection**")
st.sidebar.markdown("---")

page = st.sidebar.radio("Navigation", [
    "📊 Dashboard",
    "🖼️ Image Detection",
    "📷 Live Camera",
    "📋 Violations",
    "🎫 Challans",
    "⚙️ Settings"
])

st.sidebar.markdown("---")
st.sidebar.caption("v1.0.0 | IBSCS System")

# Load models once
helmet_model, plate_model = load_models()
ocr_reader = load_ocr()


# ==========================
# PAGE 1 — DASHBOARD
# ==========================
if page == "📊 Dashboard":
    st.title("📊 Dashboard")
    st.markdown("System overview and recent activity.")
    st.markdown("---")

    violations_df = load_violations()
    challans_df   = load_challans()

    today_str = date.today().strftime("%Y-%m-%d")

    total_violations  = len(violations_df)
    total_challans    = len(challans_df)
    pending_challans  = len(challans_df[challans_df["status"] == "pending"]) if not challans_df.empty else 0
    paid_challans     = len(challans_df[challans_df["status"] == "paid"])    if not challans_df.empty else 0
    unique_vehicles   = violations_df["vehicle_number"].nunique() if not violations_df.empty else 0
    today_violations  = len(violations_df[violations_df["timestamp"].str.startswith(today_str)]) if not violations_df.empty else 0
    today_challans    = len(challans_df[challans_df["created_at"].str.startswith(today_str)])    if not challans_df.empty else 0

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("🚨 Total Violations",  total_violations)
    col2.metric("🎫 Total Challans",    total_challans)
    col3.metric("⏳ Pending Challans",  pending_challans)
    col4.metric("✅ Paid Challans",     paid_challans)

    st.markdown("")
    col5, col6, col7 = st.columns(3)
    col5.metric("🚗 Unique Vehicles",   unique_vehicles)
    col6.metric("📅 Today's Violations", today_violations)
    col7.metric("📅 Today's Challans",   today_challans)

    st.markdown("---")

    col_a, col_b = st.columns(2)

    with col_a:
        st.subheader("Recent Violations")
        if not violations_df.empty:
            recent_v = violations_df.tail(10).iloc[::-1].reset_index(drop=True)

            def highlight_violation(row):
                if row.get("helmet_status") == "Without Helmet":
                    return ["background-color: #ffcccc"] * len(row)
                return [""] * len(row)

            st.dataframe(
                recent_v.style.apply(highlight_violation, axis=1),
                use_container_width=True
            )
        else:
            st.info("No violation records found.")

    with col_b:
        st.subheader("Recent Challans")
        if not challans_df.empty:
            recent_c = challans_df.tail(10).iloc[::-1].reset_index(drop=True)

            def highlight_challan(row):
                if row.get("status") == "paid":
                    return ["background-color: #ccffcc"] * len(row)
                return ["background-color: #fff3cc"] * len(row)

            st.dataframe(
                recent_c.style.apply(highlight_challan, axis=1),
                use_container_width=True
            )
        else:
            st.info("No challan records found.")


# ==========================
# PAGE 2 — IMAGE DETECTION
# ==========================
elif page == "🖼️ Image Detection":
    st.title("🖼️ Image Detection")
    st.markdown("Upload a vehicle image to detect helmet violations and number plates.")
    st.markdown("---")

    uploaded_file = st.file_uploader("Upload vehicle image", type=["jpg", "jpeg", "png"])

    if uploaded_file:
        file_bytes = np.frombuffer(uploaded_file.read(), np.uint8)
        image_np   = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        image_rgb  = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)

        # Resize if too large
        h, w = image_np.shape[:2]
        if w > 960:
            scale    = 960 / w
            image_np = cv2.resize(image_np, (960, int(h * scale)))
            image_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)

        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Original Image")
            st.image(image_rgb, use_container_width=True)

        if st.button("▶️ Run Detection", type="primary"):
            with st.spinner("Running AI detection..."):
                helmet_results = run_helmet_detection(image_np, helmet_model)
                plate_results  = run_plate_detection(image_np, plate_model)
                ocr_results    = {"plate_text": "", "ocr_confidence": 0.0, "ocr_success": False}

                if plate_results["plate_detected"] and plate_results["plate_crop"] is not None:
                    ocr_results = run_ocr(plate_results["plate_crop"], ocr_reader)

                annotated = draw_annotations(image_np, helmet_results, plate_results)
                annotated_rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)

            with col2:
                st.subheader("Annotated Result")
                st.image(annotated_rgb, use_container_width=True)

            # Detection Results Card
            st.markdown("---")
            st.subheader("🔍 Detection Results")

            hstatus = helmet_results["helmet_status"]
            hconf   = helmet_results["helmet_confidence"] * 100
            ptext   = ocr_results["plate_text"] or "Not Detected"
            oconf   = ocr_results["ocr_confidence"] * 100

            eligibility = check_challan_eligibility(helmet_results, plate_results, ocr_results)

            h_color = "🔴" if helmet_results["helmet_violation"] else "🟢"
            e_color = "🔴" if eligibility["eligible"] else "🟢"

            result_md = f"""
            | Field | Value |
            |-------|-------|
            | 🪖 Helmet Status | **{h_color} {hstatus}** |
            | 📊 Helmet Confidence | **{hconf:.1f}%** |
            | 🚗 Number Plate | **{ptext}** |
            | 📖 OCR Confidence | **{oconf:.1f}%** |
            | ⚠️ Challan Eligible | **{e_color} {'YES' if eligibility['eligible'] else 'NO'}** |
            """
            st.markdown(result_md)

            # Challan Section
            st.markdown("---")
            if eligibility["eligible"]:
                st.warning("⚠️ Helmet violation detected! Review and confirm challan.")

                plate_input = st.text_input(
                    "✏️ Verify/Edit Vehicle Number",
                    value=ocr_results["plate_text"],
                    key="img_plate_input"
                )
                fine = st.session_state.settings["fine_amount"]
                st.info(f"💰 Fine Amount: Rs. {fine}")

                if st.button("✅ Generate Challan", type="primary", key="img_gen_challan"):
                    challan_number = generate_challan_number()
                    evidence_path  = save_evidence(annotated, plate_input or "UNKNOWN")
                    save_violation(
                        plate_input or "UNKNOWN",
                        helmet_results["helmet_status"],
                        helmet_results["helmet_confidence"],
                        ocr_results["ocr_confidence"],
                        evidence_path,
                        "image_upload"
                    )
                    save_challan(challan_number, plate_input or "UNKNOWN", fine, evidence_path)
                    st.success(f"✅ Challan **{challan_number}** generated successfully!")
                    st.balloons()
            else:
                st.info(f"ℹ️ Challan not generated: {eligibility['reason']}")


# ==========================
# PAGE 3 — LIVE CAMERA
# ==========================
elif page == "📷 Live Camera":
    st.title("📷 Live Camera")
    st.markdown("---")

    tab1, tab2 = st.tabs(["📷 Webcam Capture", "🎥 Live Feed"])

    # --- Tab 1: Webcam Capture ---
    with tab1:
        st.subheader("Webcam Capture")
        captured = st.camera_input("Take a photo")

        if captured:
            file_bytes = np.frombuffer(captured.read(), np.uint8)
            image_np   = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

            h, w = image_np.shape[:2]
            if w > 960:
                scale    = 960 / w
                image_np = cv2.resize(image_np, (960, int(h * scale)))

            with st.spinner("Running detection..."):
                helmet_results = run_helmet_detection(image_np, helmet_model)
                plate_results  = run_plate_detection(image_np, plate_model)
                ocr_results    = {"plate_text": "", "ocr_confidence": 0.0, "ocr_success": False}

                if plate_results["plate_detected"] and plate_results["plate_crop"] is not None:
                    ocr_results = run_ocr(plate_results["plate_crop"], ocr_reader)

                annotated     = draw_annotations(image_np, helmet_results, plate_results)
                annotated_rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
                eligibility   = check_challan_eligibility(helmet_results, plate_results, ocr_results)

            col1, col2 = st.columns(2)
            with col1:
                st.image(cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB), caption="Captured", use_container_width=True)
            with col2:
                st.image(annotated_rgb, caption="Annotated", use_container_width=True)

            hstatus = helmet_results["helmet_status"]
            hconf   = helmet_results["helmet_confidence"] * 100
            ptext   = ocr_results["plate_text"] or "Not Detected"
            oconf   = ocr_results["ocr_confidence"] * 100
            h_color = "🔴" if helmet_results["helmet_violation"] else "🟢"
            e_color = "🔴" if eligibility["eligible"] else "🟢"

            st.markdown(f"""
            | Field | Value |
            |-------|-------|
            | 🪖 Helmet Status | **{h_color} {hstatus}** |
            | 📊 Helmet Confidence | **{hconf:.1f}%** |
            | 🚗 Number Plate | **{ptext}** |
            | 📖 OCR Confidence | **{oconf:.1f}%** |
            | ⚠️ Challan Eligible | **{e_color} {'YES' if eligibility['eligible'] else 'NO'}** |
            """)

            if eligibility["eligible"]:
                st.warning("⚠️ Helmet violation detected! Review and confirm challan.")
                plate_cam = st.text_input("✏️ Verify/Edit Vehicle Number", value=ocr_results["plate_text"], key="cam_plate")
                fine = st.session_state.settings["fine_amount"]
                st.info(f"💰 Fine Amount: Rs. {fine}")

                if st.button("✅ Generate Challan", type="primary", key="cam_gen_challan"):
                    challan_number = generate_challan_number()
                    evidence_path  = save_evidence(annotated, plate_cam or "UNKNOWN")
                    save_violation(plate_cam or "UNKNOWN", helmet_results["helmet_status"],
                                   helmet_results["helmet_confidence"], ocr_results["ocr_confidence"],
                                   evidence_path, "webcam_capture")
                    save_challan(challan_number, plate_cam or "UNKNOWN", fine, evidence_path)
                    st.success(f"✅ Challan **{challan_number}** generated successfully!")
                    st.balloons()
            else:
                st.info(f"ℹ️ Challan not generated: {eligibility['reason']}")

    # --- Tab 2: Live Feed ---
    with tab2:
        st.subheader("Live Camera Feed")

        col_start, col_stop = st.columns(2)
        with col_start:
            if st.button("▶️ Start Camera", type="primary", key="start_cam"):
                st.session_state.camera_running = True
                st.session_state.latest_result  = None
        with col_stop:
            if st.button("⏹️ Stop Camera", key="stop_cam"):
                st.session_state.camera_running = False

        if st.session_state.camera_running:
            frame_placeholder  = st.empty()
            status_placeholder = st.empty()
            settings           = st.session_state.settings

            try:
                cap = cv2.VideoCapture(0)
                if not cap.isOpened():
                    st.error("❌ Cannot open camera. Make sure a camera is connected.")
                    st.session_state.camera_running = False
                else:
                    frame_count   = 0
                    plate_results = {"plate_detected": False, "plate_bbox": None, "plate_confidence": 0.0, "plate_crop": None}
                    ocr_results   = {"plate_text": "", "ocr_confidence": 0.0, "ocr_success": False}

                    while st.session_state.camera_running:
                        ret, frame = cap.read()
                        if not ret:
                            st.warning("⚠️ Failed to read frame.")
                            break

                        frame_count += 1
                        start_time  = time.time()

                        if frame_count % settings["frame_interval"] == 0:
                            helmet_results = run_helmet_detection(frame, helmet_model)

                            if helmet_results["helmet_violation"]:
                                plate_results = run_plate_detection(frame, plate_model)
                                if plate_results["plate_detected"] and plate_results["plate_crop"] is not None:
                                    ocr_results = run_ocr(plate_results["plate_crop"], ocr_reader)
                                    st.session_state.latest_result = {
                                        "frame":  frame.copy(),
                                        "helmet": helmet_results,
                                        "plate":  plate_results,
                                        "ocr":    ocr_results
                                    }
                            else:
                                helmet_results = run_helmet_detection(frame, helmet_model)

                            annotated = draw_annotations(frame, helmet_results, plate_results)
                        else:
                            annotated = frame

                        proc_time = (time.time() - start_time) * 1000
                        frame_placeholder.image(
                            cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB),
                            channels="RGB",
                            use_container_width=True
                        )

                        hstatus   = helmet_results.get("helmet_status", "—") if frame_count % settings["frame_interval"] == 0 else "—"
                        plate_txt = ocr_results.get("plate_text", "—") or "—"
                        o_conf    = ocr_results.get("ocr_confidence", 0) * 100
                        h_color   = "🔴" if helmet_results.get("helmet_violation") else "🟢"

                        status_placeholder.markdown(
                            f"**{h_color} {hstatus}** | 🚗 Plate: `{plate_txt}` | "
                            f"📖 OCR: {o_conf:.1f}% | ⏱️ {proc_time:.1f}ms"
                        )

                        time.sleep(0.03)

                    cap.release()

            except Exception as e:
                st.error(f"Camera error: {e}")
                st.session_state.camera_running = False

        # Challan from latest live result
        if st.session_state.get("latest_result"):
            result = st.session_state.latest_result
            if result["helmet"]["helmet_violation"] and result["plate"]["plate_detected"]:
                st.markdown("---")
                st.warning("⚠️ Violation captured in live feed!")
                plate_live = st.text_input(
                    "✏️ Vehicle Number", value=result["ocr"]["plate_text"], key="live_plate"
                )
                fine = st.session_state.settings["fine_amount"]
                st.info(f"💰 Fine Amount: Rs. {fine}")

                if st.button("🎫 Generate Challan from Live Frame", type="primary", key="live_challan"):
                    challan_number = generate_challan_number()
                    evidence_path  = save_evidence(result["frame"], plate_live or "UNKNOWN")
                    save_violation(
                        plate_live or "UNKNOWN",
                        result["helmet"]["helmet_status"],
                        result["helmet"]["helmet_confidence"],
                        result["ocr"]["ocr_confidence"],
                        evidence_path,
                        "live_camera"
                    )
                    save_challan(challan_number, plate_live or "UNKNOWN", fine, evidence_path)
                    st.success(f"✅ Challan **{challan_number}** generated successfully!")
                    st.balloons()
                    st.session_state.latest_result = None


# ==========================
# PAGE 4 — VIOLATIONS
# ==========================
elif page == "📋 Violations":
    st.title("📋 Violation Records")
    st.markdown("---")

    violations_df = load_violations()

    if violations_df.empty:
        st.info("No violation records found.")
    else:
        st.metric("Total Violations", len(violations_df))
        st.markdown("")

        col1, col2 = st.columns([2, 1])
        with col1:
            search = st.text_input("🔍 Search by Vehicle Number", "")
        with col2:
            try:
                violations_df["date_col"] = pd.to_datetime(
                    violations_df["timestamp"], errors="coerce"
                ).dt.date
                min_date = violations_df["date_col"].min()
                max_date = violations_df["date_col"].max()
                date_range = st.date_input(
                    "📅 Date Range",
                    value=(min_date, max_date),
                    min_value=min_date,
                    max_value=max_date
                )
            except Exception:
                date_range = None

        filtered = violations_df.copy()

        if search:
            filtered = filtered[
                filtered["vehicle_number"].astype(str).str.upper().str.contains(search.upper())
            ]

        if date_range and len(date_range) == 2:
            try:
                filtered = filtered[
                    (filtered["date_col"] >= date_range[0]) &
                    (filtered["date_col"] <= date_range[1])
                ]
            except Exception:
                pass

        display_cols = ["id", "vehicle_number", "helmet_status",
                        "helmet_confidence", "ocr_confidence", "timestamp", "source_type"]
        available    = [c for c in display_cols if c in filtered.columns]
        show_df      = filtered[available].reset_index(drop=True)

        def highlight_v(row):
            if row.get("helmet_status") == "Without Helmet":
                return ["background-color: #ffcccc"] * len(row)
            return [""] * len(row)

        st.dataframe(show_df.style.apply(highlight_v, axis=1), use_container_width=True)

        csv_data = filtered.to_csv(index=False).encode("utf-8")
        st.download_button(
            "⬇️ Download CSV",
            data=csv_data,
            file_name=f"violations_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv"
        )


# ==========================
# PAGE 5 — CHALLANS
# ==========================
elif page == "🎫 Challans":
    st.title("🎫 Challan Records")
    st.markdown("---")

    challans_df = load_challans()

    if challans_df.empty:
        st.info("No challan records found.")
    else:
        total_c   = len(challans_df)
        pending_c = len(challans_df[challans_df["status"] == "pending"])
        paid_c    = len(challans_df[challans_df["status"] == "paid"])
        try:
            total_amt = challans_df[challans_df["status"] == "paid"]["amount"].astype(float).sum()
        except Exception:
            total_amt = 0

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("📄 Total Challans",  total_c)
        col2.metric("⏳ Pending",          pending_c)
        col3.metric("✅ Paid",             paid_c)
        col4.metric("💰 Amount Collected", f"Rs. {total_amt:,.0f}")

        st.markdown("---")

        def highlight_c(row):
            if row.get("status") == "paid":
                return ["background-color: #ccffcc"] * len(row)
            return ["background-color: #fff3cc"] * len(row)

        st.dataframe(
            challans_df.style.apply(highlight_c, axis=1),
            use_container_width=True
        )

        st.markdown("---")
        st.subheader("Mark Challans as Paid")
        pending_df = challans_df[challans_df["status"] == "pending"]

        if pending_df.empty:
            st.info("No pending challans.")
        else:
            for _, row in pending_df.iterrows():
                c1, c2, c3, c4 = st.columns([2, 2, 1, 1])
                c1.write(f"**{row['challan_number']}**")
                c2.write(row['vehicle_number'])
                c3.write(f"Rs. {row['amount']}")
                if c4.button("✅ Mark Paid", key=f"pay_{row['challan_number']}"):
                    try:
                        df = pd.read_csv(CHALLANS_CSV)
                        idx = df[df["challan_number"] == row["challan_number"]].index
                        if not idx.empty:
                            df.loc[idx, "status"]  = "paid"
                            df.loc[idx, "paid_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            df.to_csv(CHALLANS_CSV, index=False)
                            st.success(f"✅ Challan {row['challan_number']} marked as paid!")
                            st.rerun()
                    except Exception as e:
                        st.error(f"Error: {e}")

        csv_data = challans_df.to_csv(index=False).encode("utf-8")
        st.download_button(
            "⬇️ Download CSV",
            data=csv_data,
            file_name=f"challans_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv"
        )


# ==========================
# PAGE 6 — SETTINGS
# ==========================
elif page == "⚙️ Settings":
    st.title("⚙️ System Settings")
    st.markdown("---")

    s = st.session_state.settings

    helmet_threshold = st.slider(
        "🪖 Helmet Detection Threshold %", 50, 95, s["helmet_threshold"],
        help="Minimum confidence to consider a helmet detection valid."
    )
    plate_threshold = st.slider(
        "🚗 Plate Detection Threshold %", 50, 95, s["plate_threshold"],
        help="Minimum confidence to consider a plate detection valid."
    )
    ocr_threshold = st.slider(
        "📖 OCR Confidence Threshold %", 60, 95, s["ocr_threshold"],
        help="Minimum OCR confidence required to generate a challan."
    )
    fine_amount = st.number_input(
        "💰 Fine Amount (Rs.)", 100, 10000, s["fine_amount"], step=100,
        help="Fine amount to be imposed per challan."
    )
    frame_interval = st.slider(
        "🎞️ Process Every Nth Frame", 1, 15, s["frame_interval"],
        help="Run YOLO every Nth frame during live camera mode."
    )
    duplicate_window = st.slider(
        "🕐 Duplicate Window (minutes)", 5, 120, s["duplicate_window_minutes"],
        help="Ignore duplicate challans for the same vehicle within this window."
    )

    st.markdown("---")
    if st.button("💾 Save Settings", type="primary"):
        st.session_state.settings = {
            "helmet_threshold":          helmet_threshold,
            "plate_threshold":           plate_threshold,
            "ocr_threshold":             ocr_threshold,
            "fine_amount":               fine_amount,
            "frame_interval":            frame_interval,
            "duplicate_window_minutes":  duplicate_window
        }
        st.success("✅ Settings saved!")
