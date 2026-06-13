import re
import cv2
import numpy as np

def predict_number_plate(img, reader, conf_threshold=0.25):
    """
    Extract number plate text using EasyOCR with robust preprocessing.
    Args:
        img (np.ndarray): cropped plate image
        reader (easyocr.Reader): OCR reader
        conf_threshold (float): minimum confidence to accept text
    Returns:
        (text, score) or (None, None)
    """
    if img is None or img.size == 0:
        return None, None

    # Convert to grayscale if necessary
    if len(img.shape) == 3 and img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Resize to improve OCR on small crops
    img = cv2.resize(img, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

    # Noise reduction
    img = cv2.bilateralFilter(img, 11, 17, 17)

    # Adaptive thresholding to improve contrast
    img = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                cv2.THRESH_BINARY, 11, 2)

    try:
        results = reader.readtext(img)
    except Exception:
        return None, None

    best_text, best_score = None, 0
    for res in results:
        text = re.sub(r'[^A-Za-z0-9]', '', res[1].upper())
        score = float(res[2])
        if text and score > best_score:
            best_text = text
            best_score = score

    if best_text and best_score >= conf_threshold:
        return best_text, best_score
    return None, None