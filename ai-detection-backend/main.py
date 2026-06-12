import io
import os
import base64
import numpy as np
import cv2
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI(
    title="AI Detection API",
    description="FastAPI service running YOLOv8 object detection models (Helmet, Plate, Person)",
    version="1.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models
helmet_model = None
plate_model = None
person_model = None

@app.on_event("startup")
async def load_models():
    global helmet_model, plate_model, person_model
    print("Startup: Loading YOLOv8 models...")
    
    # Ensure models directory exists
    os.makedirs("models", exist_ok=True)
    
    # Loading Helmet model
    helmet_path = os.path.join("models", "helmet.pt")
    if os.path.exists(helmet_path):
        print(f"Loading custom helmet model from: {helmet_path}")
        helmet_model = YOLO(helmet_path)
    else:
        print(f"Warning: {helmet_path} not found. Loading standard yolov8n.pt as fallback.")
        helmet_model = YOLO("yolov8n.pt")
        
    # Loading Plate model
    plate_path = os.path.join("models", "plate.pt")
    if os.path.exists(plate_path):
        print(f"Loading custom plate model from: {plate_path}")
        plate_model = YOLO(plate_path)
    else:
        print(f"Warning: {plate_path} not found. Loading standard yolov8n.pt as fallback.")
        plate_model = YOLO("yolov8n.pt")
        
    # Loading Person model
    person_path = os.path.join("models", "person.pt")
    if os.path.exists(person_path):
        print(f"Loading custom person model from: {person_path}")
        person_model = YOLO(person_path)
    else:
        print(f"Warning: {person_path} not found. Loading standard yolov8n.pt as fallback.")
        person_model = YOLO("yolov8n.pt")
        
    print("Startup: Models successfully loaded!")


def run_inference(model, image_bytes):
    """
    Helper function to run YOLO inference on input image bytes.
    Draws annotated bounding boxes using OpenCV and outputs base64 JPEGs.
    """
    if model is None:
        raise ValueError("Model is not initialized.")
        
    # 1. Convert bytes to PIL Image and ensure RGB
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")
        
    # 2. Convert PIL Image to OpenCV BGR numpy array
    img_bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    original_height, original_width = img_bgr.shape[:2]
    
    # 3. Run model inference
    results = model(img_bgr)
    
    detections = []
    boxes = results[0].boxes
    
    if boxes is not None:
        for box in boxes:
            # Coordinates
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            class_name = model.names[cls_id]
            
            detections.append({
                "class": class_name,
                "confidence": conf,
                "bbox": [x1, y1, x2, y2]
            })
            
            # 4. Draw bounding boxes on the image buffer
            # Select color based on category
            color = (59, 130, 246)  # Default Blue BGR (246, 130, 59) -> (x,y,z) is (B,G,R)
            if "no" in class_name.lower():
                color = (59, 17, 244)  # Reddish
            elif class_name.lower() == "helmet":
                color = (16, 185, 129) # Emerald Green BGR
            elif class_name.lower() == "person":
                color = (99, 102, 241) # Indigo BGR
                
            # Draw rectangle
            cv2.rectangle(img_bgr, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
            
            # Label overlay
            label = f"{class_name} {conf:.2%}"
            (text_width, text_height), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            
            # Ensure banner text box doesn't clip screen boundaries
            label_y = max(int(y1), text_height + 10)
            
            # Draw filled rectangle for label text background
            cv2.rectangle(
                img_bgr, 
                (int(x1), label_y - text_height - 6), 
                (int(x1) + text_width + 4, label_y), 
                color, 
                -1
            )
            
            # Put text label on background
            cv2.putText(
                img_bgr, 
                label, 
                (int(x1) + 2, label_y - 3), 
                cv2.FONT_HERSHEY_SIMPLEX, 
                0.45, 
                (255, 255, 255), 
                1, 
                lineType=cv2.LINE_AA
            )
            
    # 5. Convert OpenCV annotated image buffer back to base64 string
    _, buffer = cv2.imencode('.jpg', img_bgr)
    annotated_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # 6. Return response payload
    return {
        "detections": detections,
        "annotated_image": annotated_base64,
        "count": len(detections)
    }


@app.post("/helmet")
async def detect_helmet(file: UploadFile = File(...)):
    """Runs Safety Helmet Detection on the uploaded image."""
    try:
        image_bytes = await file.read()
        return run_inference(helmet_model, image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post("/plate")
async def detect_plate(file: UploadFile = File(...)):
    """Runs License Plate Recognition on the uploaded image."""
    try:
        image_bytes = await file.read()
        return run_inference(plate_model, image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post("/person")
async def detect_person(file: UploadFile = File(...)):
    """Runs Person Detection on the uploaded image."""
    try:
        image_bytes = await file.read()
        return run_inference(person_model, image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.post("/detect_all")
async def detect_all(file: UploadFile = File(...)):
    """Runs Safety Helmet, License Plate, and Passenger (Person) detection on the same image frame."""
    try:
        image_bytes = await file.read()
        
        # 1. Convert bytes to PIL Image
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise ValueError(f"Failed to decode image: {str(e)}")
            
        # 2. Convert to BGR array for OpenCV
        img_bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        img_clean = img_bgr.copy()
        
        detections = []
        
        # Helper to execute model on clean image, but draw on annotated image
        def run_single_inference(model, class_mapping=None, default_color=(59, 130, 246)):
            nonlocal img_bgr, detections
            if model is None:
                return
                
            # Run model on clean, un-annotated image
            results = model(img_clean)
            boxes = results[0].boxes
            
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    class_name = model.names[cls_id]
                    
                    # Class name mapping
                    final_class = class_name
                    if class_mapping and class_name in class_mapping:
                        final_class = class_mapping[class_name]
                        
                    detections.append({
                        "class": final_class,
                        "confidence": conf,
                        "bbox": [x1, y1, x2, y2]
                    })
                    
                    # Select color based on category
                    color = default_color
                    if "no" in final_class.lower():
                        color = (59, 17, 244)       # Red BGR
                    elif final_class.lower() == "helmet":
                        color = (16, 185, 129)      # Emerald BGR
                    elif final_class.lower() == "passenger":
                        color = (99, 102, 241)      # Indigo BGR
                    elif "plate" in final_class.lower() or "number" in final_class.lower():
                        color = (251, 191, 36)      # Amber BGR
                        
                    cv2.rectangle(img_bgr, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                    
                    label = f"{final_class} {conf:.2%}"
                    (text_width, text_height), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                    
                    label_y = max(int(y1), text_height + 10)
                    cv2.rectangle(
                        img_bgr, 
                        (int(x1), label_y - text_height - 6), 
                        (int(x1) + text_width + 4, label_y), 
                        color, 
                        -1
                    )
                    cv2.putText(
                        img_bgr, 
                        label, 
                        (int(x1) + 2, label_y - 3), 
                        cv2.FONT_HERSHEY_SIMPLEX, 
                        0.45, 
                        (255, 255, 255), 
                        1, 
                        lineType=cv2.LINE_AA
                    )
                    
        # Execute sequentially
        run_single_inference(helmet_model, default_color=(16, 185, 129))
        run_single_inference(plate_model, class_mapping={"license_plate": "number plate", "plate": "number plate"}, default_color=(251, 191, 36))
        run_single_inference(person_model, class_mapping={"person": "passenger"}, default_color=(99, 102, 241))
        
        # 5. Convert OpenCV annotated image buffer back to base64 string
        _, buffer = cv2.imencode('.jpg', img_bgr)
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "detections": detections,
            "annotated_image": annotated_base64,
            "count": len(detections)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Merged inference error: {str(e)}")


@app.get("/")
async def root():
    """Welcome endpoint listing active models."""
    return {
        "status": "running",
        "service": "Multi-Model AI Detection API",
        "models": ["helmet", "plate", "person"]
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
