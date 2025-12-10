"""
Face Verification Service - Liveness Detection
Basic anti-spoofing using image analysis techniques
Compatible with InsightFace
"""

import numpy as np
import cv2
from typing import Dict
import logging

logger = logging.getLogger(__name__)


def detect_liveness(image: np.ndarray, blink_threshold: float = 0.25) -> Dict:
    """
    Perform liveness detection on an image
    
    Uses multiple heuristics:
    1. Face detection confidence
    2. Image sharpness (blurry = possible photo of photo)
    3. Color distribution (screens have limited color range)
    4. Face landmark analysis
    
    Returns dict with liveness results
    """
    result = {
        "is_live": False,
        "confidence": 0.0,
        "checks": {},
        "reason": None
    }
    
    try:
        # Import face detection from face_processor
        from face_processor import detect_faces
        
        # Check 1: Face detection
        faces = detect_faces(image)
        
        if len(faces) == 0:
            result["reason"] = "No face detected"
            return result
        
        face = faces[0]
        result["checks"]["face_detected"] = True
        
        # Get face bounding box
        bbox = face.bbox
        x1, y1, x2, y2 = int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])
        
        # Ensure valid coordinates
        h, w = image.shape[:2]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        
        face_region = image[y1:y2, x1:x2]
        
        if face_region.size == 0:
            result["reason"] = "Invalid face region"
            return result
        
        # Check 2: Image sharpness (Laplacian variance)
        gray_face = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray_face, cv2.CV_64F).var()
        
        result["checks"]["sharpness"] = round(laplacian_var, 2)
        is_sharp = laplacian_var > 50  # Threshold for sharpness
        result["checks"]["is_sharp"] = is_sharp
        
        # Check 3: Color variance (photos of screens have less color variance)
        hsv = cv2.cvtColor(face_region, cv2.COLOR_BGR2HSV)
        h_var = np.var(hsv[:, :, 0])
        s_var = np.var(hsv[:, :, 1])
        v_var = np.var(hsv[:, :, 2])
        
        color_variance = h_var + s_var + v_var
        result["checks"]["color_variance"] = round(color_variance, 2)
        has_natural_colors = color_variance > 500  # Natural skin has more variance
        result["checks"]["natural_colors"] = has_natural_colors
        
        # Check 4: Face size ratio (face should be reasonable size)
        face_area_ratio = ((x2 - x1) * (y2 - y1)) / (w * h)
        result["checks"]["face_size_ratio"] = round(face_area_ratio, 3)
        good_face_size = 0.05 < face_area_ratio < 0.8
        result["checks"]["good_face_size"] = good_face_size
        
        # Check 5: Reflection detection (screens often have reflections)
        # Look for bright spots in the face region
        gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        bright_pixels = np.sum(gray > 240) / gray.size
        result["checks"]["bright_pixel_ratio"] = round(bright_pixels, 4)
        no_excessive_brightness = bright_pixels < 0.1
        result["checks"]["no_reflection"] = no_excessive_brightness
        
        # Check 6: Face landmarks exist (InsightFace provides landmarks)
        has_landmarks = hasattr(face, 'landmark_2d_106') or hasattr(face, 'kps')
        result["checks"]["has_landmarks"] = has_landmarks
        
        # Check 7: Detection score from InsightFace
        det_score = float(face.det_score) if hasattr(face, 'det_score') else 0.5
        result["checks"]["detection_score"] = round(det_score, 3)
        high_confidence = det_score > 0.7
        result["checks"]["high_confidence"] = high_confidence
        
        # Calculate overall liveness score
        checks_passed = sum([
            is_sharp,
            has_natural_colors,
            good_face_size,
            no_excessive_brightness,
            has_landmarks,
            high_confidence
        ])
        
        confidence = checks_passed / 6.0
        result["confidence"] = round(confidence, 2)
        
        # Liveness passes if confidence >= 66% (4/6 checks)
        result["is_live"] = confidence >= 0.66
        
        if not result["is_live"]:
            failed_checks = []
            if not is_sharp:
                failed_checks.append("image_blurry")
            if not has_natural_colors:
                failed_checks.append("unnatural_colors")
            if not good_face_size:
                failed_checks.append("face_size")
            if not no_excessive_brightness:
                failed_checks.append("possible_reflection")
            if not high_confidence:
                failed_checks.append("low_detection_confidence")
            result["reason"] = f"Failed checks: {', '.join(failed_checks)}"
        
        return result
        
    except Exception as e:
        logger.error(f"Liveness detection error: {e}")
        result["reason"] = f"Detection error: {str(e)}"
        return result
