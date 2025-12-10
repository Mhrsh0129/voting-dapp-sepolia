"""
Face Verification Service - Face Processing Module
Uses InsightFace for face detection and embedding extraction
"""

import numpy as np
import cv2
from PIL import Image
import io
import base64
from typing import Optional, Tuple, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model instance (loaded once)
_face_analyzer = None


def get_face_analyzer():
    """
    Get or initialize the InsightFace analyzer
    Uses buffalo_l model for high accuracy
    """
    global _face_analyzer
    
    if _face_analyzer is None:
        try:
            from insightface.app import FaceAnalysis
            
            logger.info("🔄 Loading InsightFace model (first time may take a moment)...")
            
            # Initialize with buffalo_l model (best accuracy)
            _face_analyzer = FaceAnalysis(
                name='buffalo_l',
                providers=['CPUExecutionProvider']  # Use CPU (GPU optional)
            )
            
            # Prepare for 640x640 input
            _face_analyzer.prepare(ctx_id=0, det_size=(640, 640))
            
            logger.info("✅ InsightFace model loaded successfully")
            
        except ImportError:
            logger.error("❌ InsightFace library not found. Please install it with: pip install insightface")
            raise RuntimeError("InsightFace library not found. Please install it with: pip install insightface")
        except Exception as e:
            logger.error(f"❌ Failed to load InsightFace model: {e}")
            raise RuntimeError(f"Failed to initialize face analyzer: {e}")
    
    return _face_analyzer


def decode_image(image_data: str) -> np.ndarray:
    """
    Decode base64 image string to numpy array (BGR format for OpenCV)
    Handles both data URL format and raw base64
    """
    try:
        # Handle data URL format (e.g., "data:image/jpeg;base64,...")
        if "," in image_data:
            image_data = image_data.split(",")[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        # Convert to PIL Image
        pil_image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Convert to numpy array (RGB)
        rgb_array = np.array(pil_image)
        
        # Convert RGB to BGR for OpenCV/InsightFace
        bgr_array = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)
        
        return bgr_array
        
    except Exception as e:
        logger.error(f"Failed to decode image: {e}")
        raise ValueError(f"Invalid image data: {e}")


def detect_faces(image: np.ndarray) -> List:
    """
    Detect all faces in an image
    Returns list of face objects with bounding boxes and embeddings
    """
    analyzer = get_face_analyzer()
    faces = analyzer.get(image)
    return faces


def extract_embedding(image: np.ndarray) -> Tuple[Optional[np.ndarray], str]:
    """
    Extract face embedding from image
    Returns (embedding, status_message)
    - embedding: 512-dimensional numpy array or None
    - status: "success", "no_face", "multiple_faces", or error message
    """
    try:
        faces = detect_faces(image)
        
        if len(faces) == 0:
            return None, "no_face"
        
        if len(faces) > 1:
            # Use the largest face (by bounding box area)
            largest_face = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
            logger.warning("Multiple faces detected, using largest face")
            return largest_face.embedding, "success"
        
        # Single face found
        return faces[0].embedding, "success"
        
    except Exception as e:
        logger.error(f"Embedding extraction failed: {e}", exc_info=True)
        return None, f"error: {str(e)}"


def compare_embeddings(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Compare two face embeddings using cosine similarity
    Returns similarity score between 0.0 and 1.0
    """
    if embedding1 is None or embedding2 is None:
        return 0.0
    
    # Normalize embeddings
    norm1 = np.linalg.norm(embedding1)
    norm2 = np.linalg.norm(embedding2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    # Cosine similarity
    similarity = np.dot(embedding1, embedding2) / (norm1 * norm2)
    
    # Clamp to [0, 1] range (cosine similarity can be slightly negative)
    return float(max(0.0, min(1.0, (similarity + 1) / 2)))


def get_face_quality(image: np.ndarray) -> dict:
    """
    Assess face image quality
    Returns quality metrics for validation
    """
    try:
        faces = detect_faces(image)
        
        if len(faces) == 0:
            return {"valid": False, "reason": "No face detected"}
        
        face = faces[0]
        bbox = face.bbox
        
        # Calculate face size relative to image
        img_height, img_width = image.shape[:2]
        face_width = bbox[2] - bbox[0]
        face_height = bbox[3] - bbox[1]
        face_area_ratio = (face_width * face_height) / (img_width * img_height)
        
        # Quality checks
        quality = {
            "valid": True,
            "face_count": len(faces),
            "face_size_ratio": round(face_area_ratio, 3),
            "face_width": int(face_width),
            "face_height": int(face_height),
            "bbox": [int(x) for x in bbox],
        }
        
        # Minimum face size check (at least 5% of image)
        if face_area_ratio < 0.05:
            quality["valid"] = False
            quality["reason"] = "Face too small - move closer to camera"
        
        # Check if face is centered (roughly)
        face_center_x = (bbox[0] + bbox[2]) / 2
        face_center_y = (bbox[1] + bbox[3]) / 2
        
        center_offset_x = abs(face_center_x - img_width / 2) / img_width
        center_offset_y = abs(face_center_y - img_height / 2) / img_height
        
        quality["center_offset_x"] = round(center_offset_x, 3)
        quality["center_offset_y"] = round(center_offset_y, 3)
        
        if center_offset_x > 0.3 or center_offset_y > 0.3:
            quality["warning"] = "Face not centered - please look at camera"
        
        return quality
        
    except Exception as e:
        return {"valid": False, "reason": f"Quality check failed: {str(e)}", "exception": str(e)}
