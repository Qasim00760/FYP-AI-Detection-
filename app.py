import os
import csv
import time
import tempfile
from datetime import datetime

import cv2
import av
import torch
import numpy as np
import pandas as pd
import streamlit as st
from ultralytics import YOLO
import easyocr
from streamlit_webrtc import webrtc_streamer, VideoProcessorBase

from image_to_text import predict_number_plate

# ==========================
# SETTINGS
# ==========================
torch.set_num_threads(8)
MODEL_HELMET_PATH = "best.pt"
MODEL_PLATE_PATH = "number_plate_detection.pt"
VIDEO_WIDTH = 640
VIDEO_HEIGHT = 360
MAX_LIVE_FPS = 15
MIN_FRAME_INTERVAL = 1.0 / MAX_LIVE_FPS
YOLO_IMGSZ = 320
OCR_EVERY_N_FRAMES = 1
CSV_FILE = "violations.csv"

CLASS_WITH_HELMET = "with helmet"
CLASS_WITHOUT_HELMET = "without helmet"
CLASS_RIDER = "rider"
CLASS_NUMBER_PLATE = "number plate"

# ==========================
# STREAMLIT PAGE
# ==========================
st.set_page_config(page_title="Helmet & Number Plate Detection",
                   page_icon="🪖", layout="wide")
st.markdown("""
<style>
    .stApp { background-color: #f0f2f6; font-family: 'Arial', sans-serif; }
    h1, h2, h3 { font-family: 'Verdana', sans-serif; }
</style>
""", unsafe_allow_html=True)
st.title("🪖 Helmet & Number Plate Detection System")
st.markdown("---")

# Sidebar
st.sidebar.header("Settings")
CONF_THRESHOLD = st.sidebar.slider("Detection Confidence", 0.10, 1.0, 0.5, 0.05)
OCR_CONF_THRESHOLD = st.sidebar.slider("OCR Confidence", 0.10, 1.0, 0.25, 0.05)
st.sidebar.markdown("**Video Display Size:** 640x360")
st.sidebar.markdown("Dual YOLOv8 Models: Helmet/Passenger + Number Plate")
st.sidebar.markdown("OCR via image_to_text.py")

# ==========================
# LOAD MODELS
# ==========================
@st.cache_resource
def load_models():
    model_helmet = YOLO(MODEL_HELMET_PATH)
    model_plate = YOLO(MODEL_PLATE_PATH)
    try:
        model_path = os.path.join(os.path.expanduser("~"), ".EasyOCR", "model")
        if not os.path.exists(model_path) or len(os.listdir(model_path)) == 0:
            st.info("Downloading EasyOCR model files...")
            reader = easyocr.Reader(['en'], gpu=False, download_enabled=True)
        else:
            reader = easyocr.Reader(['en'], gpu=False, download_enabled=False)
    except Exception:
        st.error("Failed to initialize EasyOCR. Place models manually in .EasyOCR/model")
        st.stop()
    return model_helmet, model_plate, reader

model_helmet, model_plate, reader = load_models()

# ==========================
# Helper Functions
# ==========================
def log_violation(plate_text, violation_type):
    file_exists = os.path.isfile(CSV_FILE)
    with open(CSV_FILE, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["Timestamp", "Plate", "Violation"])
        writer.writerow([
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            plate_text if plate_text else "UNKNOWN",
            violation_type
        ])

def resize_frame(frame):
    return cv2.resize(frame, (VIDEO_WIDTH, VIDEO_HEIGHT), interpolation=cv2.INTER_AREA)

def process_frame(frame, last_plate="", run_ocr=True, log_event=False):
    frame = resize_frame(frame)

    # Helmet & rider detection
    results_helmet = model_helmet(frame, imgsz=YOLO_IMGSZ, conf=CONF_THRESHOLD)[0]
    has_rider = False
    has_without_helmet = False
    for box in results_helmet.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cls_id = int(box.cls[0])
        score = float(box.conf[0]) if box.conf[0] is not None else 0.0
        label = model_helmet.names.get(cls_id, str(cls_id)).lower().strip()
        if label == CLASS_WITH_HELMET:
            color = (0, 200, 0)
        elif label == CLASS_WITHOUT_HELMET:
            color = (255, 0, 0)
            has_without_helmet = True
        elif label == CLASS_RIDER:
            color = (0, 255, 255)
            has_rider = True
        else:
            color = (200, 200, 200)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, f"{label} {score:.2f}", (x1, max(20, y1-8)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 2)

    # Number plate detection
    results_plate = model_plate(frame, imgsz=YOLO_IMGSZ, conf=CONF_THRESHOLD)[0]
    plate_text = last_plate
    for box in results_plate.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        crop = frame[y1:y2, x1:x2]
        if crop.size == 0:
            continue
        if run_ocr:
            detected_text, _ = predict_number_plate(crop, reader, conf_threshold=OCR_CONF_THRESHOLD)
            if detected_text:
                plate_text = detected_text
        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 165, 0), 2)
        cv2.putText(frame, "Plate", (x1, max(20, y1-8)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255,165,0), 2)

    violation_detected = has_rider and has_without_helmet
    if violation_detected and log_event:
        log_violation(plate_text, "WITHOUT HELMET")
        st.success("Violation Detected!")

    if plate_text:
        cv2.putText(frame, f"Plate: {plate_text}", (15, VIDEO_HEIGHT-18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,165,0),2)

    return frame, plate_text, violation_detected

# ==========================
# Tabs
# ==========================
tab1, tab2, tab3 = st.tabs(["📹 Live Camera", "📁 Video Upload", "🧾 Violations Log"])

# --- Live Camera ---
with tab1:
    st.subheader("Live Camera Detection")
    camera_choice = st.selectbox("Choose Camera", ["Front Camera", "Back Camera"])
    class VideoProcessor(VideoProcessorBase):
        def __init__(self):
            self.frame_count = 0
            self.last_plate = ""
            self.last_output = np.zeros((VIDEO_HEIGHT, VIDEO_WIDTH,3),dtype=np.uint8)
            self.last_logged_time = 0
            self.last_process_time = 0

        def recv(self, frame):
            now = time.time()
            img = frame.to_ndarray(format="bgr24")
            if now - self.last_process_time < MIN_FRAME_INTERVAL:
                return av.VideoFrame.from_ndarray(self.last_output, format="bgr24")
            self.last_process_time = now
            self.frame_count +=1
            run_ocr = self.frame_count % OCR_EVERY_N_FRAMES==0
            should_log = now - self.last_logged_time > 3
            annotated, plate_text, violation_detected = process_frame(img, last_plate=self.last_plate, run_ocr=run_ocr, log_event=should_log)
            if plate_text: self.last_plate = plate_text
            if violation_detected and should_log: self.last_logged_time = now
            self.last_output = annotated
            return av.VideoFrame.from_ndarray(annotated, format="bgr24")

    webrtc_streamer(key="live", video_processor_factory=VideoProcessor,
                    media_stream_constraints={"video": True, "audio": False}, async_processing=True)

# --- Video Upload ---
with tab2:
    st.subheader("Video Upload Detection")
    uploaded_file = st.file_uploader("Upload video", type=["mp4","avi","mov","mkv"])
    if uploaded_file:
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        temp_file.write(uploaded_file.read())
        temp_file.close()
        if st.button("Start Processing"):
            cap = cv2.VideoCapture(temp_file.name)
            frame_placeholder = st.empty()
            progress = st.progress(0)
            frame_count = 0
            processed_count = 0
            last_plate = ""
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret: break
                frame_count +=1
                processed_count +=1
                run_ocr = processed_count % OCR_EVERY_N_FRAMES==0
                annotated, plate_text, violation_detected = process_frame(frame,last_plate=last_plate, run_ocr=run_ocr, log_event=True)
                if plate_text: last_plate = plate_text
                rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
                frame_placeholder.image(rgb, channels="RGB", use_column_width=True)
                if total_frames>0: progress.progress(min(frame_count/total_frames,1.0))
            cap.release()
            os.remove(temp_file.name)
            st.success("Video processing complete!")

# --- Violations Log ---
with tab3:
    st.subheader("Violations Log")
    if os.path.exists(CSV_FILE):
        df = pd.read_csv(CSV_FILE, on_bad_lines='skip')
        st.download_button("Download CSV", data=df.to_csv(index=False), file_name="violations.csv", mime="text/csv")
        st.dataframe(df,use_container_width=True)
    else:
        st.info("No violations recorded yet.")