# VotEth Face Verification System - Deployment Guide

## 🚀 Quick Start

### Windows Users
Double-click: `START_ALL.bat`

This will:
1. Kill any existing processes on ports 8000 and 8080
2. Start Face Service (port 8000)
3. Start HTTP Server (port 8080)
4. Open enrollment page in your browser

### Mac/Linux Users
Run in terminal from `face-service/` directory:
```bash
./start.sh
```

---

## 📋 System Requirements

- **Python**: 3.13.3 (installed in venv313)
- **Ports**: 8000 (Face API), 8080 (HTTP Server)
- **Webcam**: Required for face enrollment
- **Modern Browser**: Chrome, Firefox, Edge, Safari

---

## 🔧 Manual Setup (if needed)

### 1. Create Python Virtual Environment
```bash
python -m venv venv313
```

### 2. Activate Virtual Environment
**Windows:**
```bash
venv313\Scripts\activate
```

**Mac/Linux:**
```bash
source venv313/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Start Face Service
```bash
python main.py
```

This will:
- Load InsightFace buffalo_l model
- Initialize SQLite database
- Start FastAPI server on http://localhost:8000

### 5. Start HTTP Server (in another terminal)
```bash
python -m http.server 8080
```

### 6. Open Enrollment Page
```
http://localhost:8080/enroll.html
```

---

## 📁 Project Structure

```
face-service/
├── main.py                 # FastAPI application
├── face_processor.py       # InsightFace integration
├── liveness.py             # Anti-spoofing detection
├── models.py               # Database models
├── database.py             # SQLAlchemy async setup
├── auth.py                 # JWT authentication
├── config.py               # Environment settings
├── enroll.html             # Enrollment UI
├── face_data.db            # SQLite database
├── requirements.txt        # Python dependencies
├── START_ALL.bat           # Windows startup script
├── start.sh                # Mac/Linux startup script
├── venv313/                # Python virtual environment
└── README.md               # This file
```

---

## 🎯 How to Use

### Enrolling a Face

1. **Open Enrollment Page**: http://localhost:8080/enroll.html
2. **Enter Voter ID**: Unique identifier (wallet address, voter ID, etc.)
3. **Click "Start Camera"**: Allow camera access when prompted
4. **Position Your Face**: Face the camera directly with good lighting
5. **Click "Capture"**: Take a photo of your face
6. **Click "Enroll Face"**: Save face embedding to database

The system stores a 512-dimensional face embedding, NOT the actual image.

---

## 🔐 API Endpoints

### Health Check
```bash
GET http://localhost:8000/health
```

### Enroll User
```bash
POST http://localhost:8000/enroll
Content-Type: application/json

{
  "user_id": "voter_001",
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "voter_001",
  "message": "User enrolled successfully"
}
```

### Verify Face
```bash
POST http://localhost:8000/verify
Content-Type: application/json

{
  "user_id": "voter_001",
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "voter_001",
  "similarity_score": 0.85,
  "liveness_passed": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get User Info
```bash
GET http://localhost:8000/user/{user_id}
```

### Delete User
```bash
DELETE http://localhost:8000/user/{user_id}
```

### API Documentation
```
http://localhost:8000/docs
```

---

## 🔐 Security Features

1. **Face Embeddings**: Stores 512-dimensional vectors, not images
2. **Liveness Detection**: Prevents spoofing with static images
3. **JWT Tokens**: Secure authentication with 10-minute expiry
4. **Rate Limiting**: Prevents brute-force attacks
5. **CORS Enabled**: Safe cross-origin communication
6. **SQLite Database**: Local encrypted storage

---

## 📊 Configuration

Edit `config.py` to customize:

```python
SIMILARITY_THRESHOLD = 0.70        # 70% match required
JWT_EXPIRY_MINUTES = 10            # Token validity
HOST = "0.0.0.0"                   # Bind to all interfaces
PORT = 8000                        # API port
```

---

## 🛠️ Troubleshooting

### Issue: "Port 8000 already in use"
```bash
# Windows
netstat -ano | findstr :8000
taskkill /pid <PID> /f

# Mac/Linux
lsof -i :8000
kill -9 <PID>
```

### Issue: "File not found" when opening enrollment page
- Make sure HTTP server is running in the correct directory
- Check: `cd face-service/` before starting HTTP server
- Verify `enroll.html` exists in `face-service/` folder

### Issue: Camera permission denied
- Browser permissions issue
- Use a real browser (Chrome, Firefox, Edge) not embedded viewers
- Check browser camera permissions settings

### Issue: Face not enrolling
- Good lighting is essential
- Face must be clearly visible
- Remove glasses if possible
- Keep neutral expression
- Face must be within detection frame

---

## 📦 Dependencies

### Python Packages
- **fastapi** (0.124.0): Web framework
- **uvicorn** (0.38.0): ASGI server
- **sqlalchemy** (2.0.45): Database ORM
- **insightface** (0.7.3): Face recognition
- **opencv-python** (4.12.0.88): Computer vision
- **python-jose**: JWT authentication
- **passlib**: Password hashing
- **slowapi**: Rate limiting
- **pydantic-settings**: Configuration management

---

## 🚀 Deployment Checklist

- [ ] Python 3.13.3 installed
- [ ] Virtual environment created (venv313)
- [ ] All dependencies installed
- [ ] Ports 8000 and 8080 available
- [ ] Webcam working
- [ ] Enrollment page loads at http://localhost:8080/enroll.html
- [ ] Can enroll a test face
- [ ] Can verify enrolled face
- [ ] API responds at http://localhost:8000/health
- [ ] Documentation available at http://localhost:8000/docs

---

## 📝 Usage Examples

### Python Script
```python
import requests
import base64

API_URL = "http://localhost:8000"

# Read image
with open("face.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode('utf-8')
    image_data_uri = f"data:image/jpeg;base64,{image_b64}"

# Enroll
response = requests.post(
    f"{API_URL}/enroll",
    json={"user_id": "voter_001", "image": image_data_uri}
)
print(response.json())

# Verify
response = requests.post(
    f"{API_URL}/verify",
    json={"user_id": "voter_001", "image": image_data_uri}
)
print(response.json())
```

### cURL
```bash
# Health check
curl http://localhost:8000/health

# API docs
curl http://localhost:8000/docs
```

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review API documentation at http://localhost:8000/docs
3. Check service logs in terminal windows
4. Verify all ports are available

---

## ✅ Verification Workflow

1. **Enrollment Phase**
   - User captures face via webcam
   - System extracts 512-dim embedding
   - Stores embedding + metadata in database

2. **Verification Phase**
   - User captures face again
   - System extracts embedding
   - Compares with stored embedding (70% threshold)
   - Performs liveness check (anti-spoofing)
   - Returns JWT token if verified

3. **Voting Phase**
   - JWT token allows access to voting
   - Token expires after 10 minutes
   - User must re-verify for another vote

---

**Ready for deployment! 🚀**
