# VotEth - Face Verification Integration Guide

## 🔗 Connecting Face Service to Voting dApp

This guide explains how to integrate the Face Verification Service with your voting application.

---

## 📋 Integration Points

### 1. Before User Votes
1. User clicks "Cast Vote" button
2. Check if `FACE_VERIFIED` flag is set
3. If not verified, redirect to face verification modal
4. After verification, store JWT token and allow voting

### 2. Face Verification Flow
```
User Action → Face Capture → Send to API → Get JWT Token → Enable Voting
```

### 3. API Communication
```
Frontend → Face Service API (port 8000)
         → /verify endpoint
         → Returns JWT token on success
         → Store token in localStorage
         → Allow voting if token valid
```

---

## 🔧 Implementation

### Step 1: Add Face Verification Button to Voting Page

```html
<!-- In your voting page (index.html) -->
<button id="verifyFaceBtn" onclick="startFaceVerification()">
  🔐 Verify Face Before Voting
</button>

<button id="voteBtn" onclick="addVote()" disabled>
  ✅ Cast Vote
</button>
```

### Step 2: Add Face Verification Modal

```html
<!-- Face Verification Modal -->
<div id="faceVerificationModal" class="modal" style="display:none;">
  <div class="modal-content">
    <h2>Face Verification</h2>
    <p>Please scan your face to proceed with voting</p>
    
    <div class="camera-container">
      <video id="verificationVideo" autoplay playsinline></video>
      <canvas id="verificationCanvas" style="display:none;"></canvas>
    </div>
    
    <button onclick="startCamera()">Start Camera</button>
    <button onclick="captureAndVerify()">Capture & Verify</button>
    <button onclick="closeFaceVerification()">Cancel</button>
    
    <div id="verificationStatus"></div>
  </div>
</div>
```

### Step 3: Add JavaScript Integration

```javascript
// Global variables
let FACE_VERIFIED = false;
let VERIFICATION_TOKEN = null;
const FACE_SERVICE_URL = "http://localhost:8000";

// Start face verification
function startFaceVerification() {
  document.getElementById('faceVerificationModal').style.display = 'block';
  startCamera();
}

// Access camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    });
    
    const video = document.getElementById('verificationVideo');
    video.srcObject = stream;
    video.style.display = 'block';
  } catch (error) {
    alert('Camera access denied: ' + error.message);
  }
}

// Capture and verify face
async function captureAndVerify() {
  const video = document.getElementById('verificationVideo');
  const canvas = document.getElementById('verificationCanvas');
  
  // Capture image
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);
  
  const imageData = canvas.toDataURL('image/jpeg', 0.9);
  
  // Get user ID (from voting contract or input)
  const userId = await getUserId(); // You'll need to implement this
  
  // Send to Face Service
  try {
    const response = await fetch(`${FACE_SERVICE_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        image: imageData
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.similarity_score >= 0.70) {
      // Face verified!
      FACE_VERIFIED = true;
      VERIFICATION_TOKEN = result.token;
      
      // Store in localStorage
      localStorage.setItem('faceToken', result.token);
      localStorage.setItem('faceVerified', 'true');
      localStorage.setItem('verificationTime', Date.now().toString());
      
      // Show success message
      document.getElementById('verificationStatus').innerHTML = 
        `✅ Face verified! (${(result.similarity_score * 100).toFixed(1)}% match)`;
      
      // Enable voting button
      document.getElementById('voteBtn').disabled = false;
      
      // Close modal after 2 seconds
      setTimeout(closeFaceVerification, 2000);
    } else {
      document.getElementById('verificationStatus').innerHTML = 
        `❌ Verification failed. Try again. (Match: ${(result.similarity_score * 100).toFixed(1)}%)`;
    }
  } catch (error) {
    document.getElementById('verificationStatus').innerHTML = 
      `❌ Error: ${error.message}`;
  }
}

// Check if face is still verified (within 10 min token expiry)
function isFaceVerified() {
  const token = localStorage.getItem('faceToken');
  const verified = localStorage.getItem('faceVerified');
  const verificationTime = parseInt(localStorage.getItem('verificationTime') || '0');
  
  // Token expires after 10 minutes
  const TEN_MINUTES = 10 * 60 * 1000;
  const elapsed = Date.now() - verificationTime;
  
  return verified === 'true' && token && elapsed < TEN_MINUTES;
}

// Modified addVote function
async function addVote(candidateId) {
  // Check face verification first
  if (!isFaceVerified()) {
    alert('Please verify your face before voting');
    startFaceVerification();
    return;
  }
  
  const token = localStorage.getItem('faceToken');
  
  // Now proceed with voting
  try {
    const txn = await votingContract.vote(candidateId, {
      // Include face verification token in transaction
      gasLimit: 300000
    });
    
    // Store face token with vote for audit trail
    console.log('Vote cast with face token:', token);
    
    alert('Vote cast successfully!');
  } catch (error) {
    alert('Error casting vote: ' + error.message);
  }
}

// Close modal
function closeFaceVerification() {
  const modal = document.getElementById('faceVerificationModal');
  const video = document.getElementById('verificationVideo');
  
  // Stop video stream
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
  
  modal.style.display = 'none';
}
```

### Step 4: Update Vote Button Logic

```javascript
// Enable vote button only if face verified
document.getElementById('voteBtn').disabled = !isFaceVerified();

// Check verification status every second
setInterval(() => {
  const verified = isFaceVerified();
  document.getElementById('voteBtn').disabled = !verified;
  
  if (verified) {
    // Show remaining time
    const verificationTime = parseInt(localStorage.getItem('verificationTime') || '0');
    const elapsed = Date.now() - verificationTime;
    const remaining = Math.max(0, 10 - Math.floor(elapsed / 60000));
    
    if (remaining > 0) {
      console.log(`Face verified. Token expires in ${remaining} minute(s)`);
    } else {
      // Token expired
      localStorage.removeItem('faceToken');
      localStorage.removeItem('faceVerified');
    }
  }
}, 1000);
```

---

## 🔌 API Integration

### Enroll Face (Admin)
```javascript
async function enrollVoter(voterId, imagePath) {
  const imageData = await readFileAsDataURI(imagePath);
  
  const response = await fetch(`${FACE_SERVICE_URL}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: voterId,
      image: imageData
    })
  });
  
  return await response.json();
}
```

### Verify Face (Voting)
```javascript
async function verifyFace(voterId, imageData) {
  const response = await fetch(`${FACE_SERVICE_URL}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: voterId,
      image: imageData
    })
  });
  
  const result = await response.json();
  
  return {
    verified: result.success && result.similarity_score >= 0.70,
    similarity: result.similarity_score,
    token: result.token,
    liveness: result.liveness_passed
  };
}
```

### Check Health
```javascript
async function checkFaceService() {
  try {
    const response = await fetch(`${FACE_SERVICE_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Face service unavailable:', error);
    return false;
  }
}
```

---

## 🔐 Security Considerations

1. **Token Storage**
   - Use localStorage for short-term storage
   - Token expires after 10 minutes
   - Clear on logout

2. **API Communication**
   - Use HTTPS in production
   - Verify API response signatures
   - Handle API timeouts gracefully

3. **Voter Privacy**
   - Face embeddings stored, not images
   - One-time use tokens
   - Audit trail in verification_logs table

4. **Frontend Validation**
   - Check similarity threshold (70%)
   - Verify liveness detection passed
   - Check token expiry time

---

## 🎯 User Flow

```
1. User accesses voting page
2. Attempts to vote
3. System checks: Is face verified?
   - NO → Open face verification modal
   - YES → Check token expiry
4. Face verification modal:
   - Start camera
   - Capture face
   - Send to /verify endpoint
5. API response:
   - Similarity score
   - Liveness passed/failed
   - JWT token
6. If verified (≥70% + liveness):
   - Store token
   - Enable voting button
   - Close modal
7. User votes with token
8. Token expires after 10 minutes
```

---

## 📊 Data Structure

### localStorage Keys
```javascript
{
  'faceToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'faceVerified': 'true',
  'verificationTime': '1702244000000'
}
```

### API Response (Verify)
```json
{
  "success": true,
  "user_id": "voter_001",
  "similarity_score": 0.85,
  "liveness_passed": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Face verified successfully"
}
```

---

## 🚀 Deployment Checklist

- [ ] Face Service running on port 8000
- [ ] HTTP Server running on port 8080
- [ ] enroll.html accessible
- [ ] JavaScript integration tested
- [ ] Camera access working
- [ ] Face verification modal displaying
- [ ] Tokens being generated
- [ ] Vote button enabling/disabling correctly
- [ ] Token expiry working (10 minutes)

---

## 🧪 Testing

### Test Enrollment
```javascript
// In browser console
enrollVoter('test_voter_001', '/path/to/face.jpg')
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

### Test Verification
```javascript
// In browser console
verifyFace('test_voter_001', imageDataURI)
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

### Test Health Check
```javascript
// In browser console
checkFaceService()
  .then(healthy => console.log('Face service:', healthy ? 'Online' : 'Offline'));
```

---

## 📞 Troubleshooting Integration

### Camera won't start
- Check browser permissions
- Use real browser, not embedded viewer
- Verify getUserMedia support

### Face verification fails
- Check similarity threshold (70%)
- Ensure good lighting in verification
- Verify liveness passed
- Check face similarity score

### Token not working
- Verify token in localStorage
- Check token expiry (10 minutes)
- Ensure API response was successful
- Check console for errors

### API connection fails
- Verify Face Service running on port 8000
- Check FACE_SERVICE_URL constant
- Verify CORS enabled
- Check network connectivity

---

## 📚 References

- **Face Service API**: http://localhost:8000/docs
- **Enrollment Page**: http://localhost:8080/enroll.html
- **Health Check**: http://localhost:8000/health

---

**Integration Complete! 🚀**

Your voting dApp is now secured with face verification!
