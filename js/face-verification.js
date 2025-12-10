/**
 * VotEth Face Verification Manager
 * Frontend component for face capture and verification
 */

class FaceVerificationManager {
    constructor(options = {}) {
        // Configuration
        this.apiUrl = options.apiUrl || 'http://localhost:8000';
        this.onVerified = options.onVerified || (() => {});
        this.onError = options.onError || ((err) => console.error(err));
        this.onStatusChange = options.onStatusChange || (() => {});
        
        // State
        this.stream = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.verificationToken = null;
        this.tokenExpiry = null;
        this.isProcessing = false;
        this.isEnrolled = false;
        
        // Bind methods
        this.startCamera = this.startCamera.bind(this);
        this.stopCamera = this.stopCamera.bind(this);
        this.captureImage = this.captureImage.bind(this);
        this.enroll = this.enroll.bind(this);
        this.verify = this.verify.bind(this);
    }

    /**
     * Initialize the face verification UI
     */
    async init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container #${containerId} not found`);
        }

        // Create UI
        container.innerHTML = this.createUI();
        
        // Get elements
        this.videoElement = document.getElementById('faceVideo');
        this.canvasElement = document.getElementById('faceCanvas');
        this.statusElement = document.getElementById('faceStatus');
        this.resultElement = document.getElementById('faceResult');
        
        // Set up event listeners
        document.getElementById('startCameraBtn')?.addEventListener('click', this.startCamera);
        document.getElementById('captureBtn')?.addEventListener('click', () => this.verify());
        document.getElementById('enrollBtn')?.addEventListener('click', () => this.enroll());
        document.getElementById('stopCameraBtn')?.addEventListener('click', this.stopCamera);
        
        console.log('✅ Face Verification Manager initialized');
    }

    /**
     * Create the verification UI HTML
     */
    createUI() {
        return `
            <div class="face-verification-container">
                <div class="face-header">
                    <h3>🔐 Face Verification</h3>
                    <p id="faceStatus" class="face-status">Click "Start Camera" to begin</p>
                </div>
                
                <div class="face-camera-section">
                    <div class="face-video-container">
                        <video id="faceVideo" autoplay playsinline muted></video>
                        <canvas id="faceCanvas" style="display: none;"></canvas>
                        <div class="face-overlay">
                            <div class="face-guide"></div>
                        </div>
                    </div>
                </div>
                
                <div class="face-controls">
                    <button id="startCameraBtn" class="face-btn face-btn-primary">
                        📷 Start Camera
                    </button>
                    <button id="captureBtn" class="face-btn face-btn-success" disabled>
                        ✅ Verify Face
                    </button>
                    <button id="enrollBtn" class="face-btn face-btn-secondary" disabled>
                        📝 Enroll Face
                    </button>
                    <button id="stopCameraBtn" class="face-btn face-btn-danger" disabled>
                        ⏹️ Stop
                    </button>
                </div>
                
                <div id="faceResult" class="face-result"></div>
                
                <div class="face-info">
                    <small>
                        🔒 Your face data is processed securely and never stored on blockchain.
                        <br>Verification requires ≥70% match with enrolled face.
                    </small>
                </div>
            </div>
        `;
    }

    /**
     * Start the camera stream
     */
    async startCamera() {
        try {
            this.updateStatus('Starting camera...', 'info');
            
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            
            // Connect stream to video element
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            
            // Enable buttons
            document.getElementById('startCameraBtn').disabled = true;
            document.getElementById('captureBtn').disabled = false;
            document.getElementById('enrollBtn').disabled = false;
            document.getElementById('stopCameraBtn').disabled = false;
            
            this.updateStatus('Camera ready. Position your face in the frame.', 'success');
            
            // Check enrollment status
            await this.checkEnrollmentStatus();
            
        } catch (error) {
            console.error('Camera error:', error);
            this.updateStatus('Failed to access camera: ' + error.message, 'error');
            this.onError(error);
        }
    }

    /**
     * Stop the camera stream
     */
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        
        // Reset buttons
        document.getElementById('startCameraBtn').disabled = false;
        document.getElementById('captureBtn').disabled = true;
        document.getElementById('enrollBtn').disabled = true;
        document.getElementById('stopCameraBtn').disabled = true;
        
        this.updateStatus('Camera stopped', 'info');
    }

    /**
     * Capture current frame as base64
     */
    captureImage() {
        if (!this.videoElement || !this.canvasElement) {
            throw new Error('Video/canvas elements not initialized');
        }
        
        const ctx = this.canvasElement.getContext('2d');
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        
        // Draw video frame to canvas
        ctx.drawImage(this.videoElement, 0, 0);
        
        // Get base64 image (JPEG for smaller size)
        return this.canvasElement.toDataURL('image/jpeg', 0.9);
    }

    /**
     * Get current user ID (wallet address)
     */
    getUserId() {
        // Try to get wallet address from global state
        if (window.userAddress) {
            return window.userAddress.toLowerCase();
        }
        if (window.connectedAddress) {
            return window.connectedAddress.toLowerCase();
        }
        // Fallback: prompt or generate
        const stored = localStorage.getItem('voteth_user_id');
        if (stored) return stored;
        
        const newId = 'user_' + Date.now();
        localStorage.setItem('voteth_user_id', newId);
        return newId;
    }

    /**
     * Check if current user is enrolled
     */
    async checkEnrollmentStatus() {
        try {
            const userId = this.getUserId();
            const response = await fetch(`${this.apiUrl}/status/${userId}`);
            const data = await response.json();
            
            this.isEnrolled = data.enrolled;
            
            if (this.isEnrolled) {
                document.getElementById('enrollBtn').textContent = '🔄 Re-enroll';
                this.updateStatus('Face enrolled. Click "Verify Face" to authenticate.', 'success');
            } else {
                this.updateStatus('Not enrolled. Click "Enroll Face" first.', 'warning');
            }
            
        } catch (error) {
            console.warn('Could not check enrollment status:', error);
        }
    }

    /**
     * Enroll current face
     */
    async enroll() {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            this.updateStatus('Capturing face for enrollment...', 'info');
            
            const userId = this.getUserId();
            const imageData = this.captureImage();
            
            this.updateStatus('Processing enrollment...', 'info');
            
            const response = await fetch(`${this.apiUrl}/enroll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    image: imageData
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.isEnrolled = true;
                this.showResult('success', '✅ Face enrolled successfully! You can now verify.');
                this.updateStatus('Enrolled! Click "Verify Face" to authenticate.', 'success');
                document.getElementById('enrollBtn').textContent = '🔄 Re-enroll';
            } else {
                this.showResult('error', '❌ Enrollment failed: ' + (result.detail || result.message));
                this.updateStatus('Enrollment failed. Try again.', 'error');
            }
            
        } catch (error) {
            console.error('Enrollment error:', error);
            this.showResult('error', '❌ Error: ' + error.message);
            this.onError(error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Verify current face against enrolled face
     */
    async verify() {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            this.updateStatus('Capturing face for verification...', 'info');
            
            const userId = this.getUserId();
            const imageData = this.captureImage();
            
            this.updateStatus('Verifying face... Please wait.', 'info');
            
            const response = await fetch(`${this.apiUrl}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    image: imageData,
                    skip_liveness: false
                })
            });
            
            const result = await response.json();
            
            if (response.status === 404) {
                this.showResult('warning', '⚠️ Not enrolled. Please enroll your face first.');
                this.updateStatus('Please enroll first', 'warning');
                return;
            }
            
            if (!response.ok) {
                this.showResult('error', '❌ ' + (result.detail || 'Verification failed'));
                return;
            }
            
            if (result.verified) {
                // Success!
                this.verificationToken = result.token;
                this.tokenExpiry = Date.now() + (result.expires_in_seconds * 1000);
                
                // Store token for voting
                localStorage.setItem('face_verification_token', result.token);
                localStorage.setItem('face_verification_expiry', this.tokenExpiry.toString());
                
                this.showResult('success', `
                    ✅ <strong>Verification Successful!</strong><br>
                    Match: ${result.similarity_score.toFixed(1)}%<br>
                    Token valid for ${Math.round(result.expires_in_seconds / 60)} minutes
                `);
                this.updateStatus('✅ Verified! You can now vote.', 'success');
                
                // Callback
                this.onVerified({
                    token: result.token,
                    score: result.similarity_score,
                    expiresIn: result.expires_in_seconds
                });
                
            } else {
                let message = `❌ Verification failed (${result.similarity_score.toFixed(1)}% match, need 70%)`;
                
                if (!result.liveness_passed) {
                    message = '❌ Liveness check failed. Please use a real camera and look directly at it.';
                }
                
                this.showResult('error', message);
                this.updateStatus('Verification failed. Try again.', 'error');
            }
            
        } catch (error) {
            console.error('Verification error:', error);
            this.showResult('error', '❌ Error: ' + error.message);
            this.onError(error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Check if user has a valid verification token
     */
    hasValidToken() {
        const token = localStorage.getItem('face_verification_token');
        const expiry = parseInt(localStorage.getItem('face_verification_expiry') || '0');
        
        if (token && expiry > Date.now()) {
            this.verificationToken = token;
            this.tokenExpiry = expiry;
            return true;
        }
        
        // Clear expired token
        localStorage.removeItem('face_verification_token');
        localStorage.removeItem('face_verification_expiry');
        return false;
    }

    /**
     * Get current verification token
     */
    getToken() {
        if (this.hasValidToken()) {
            return this.verificationToken;
        }
        return null;
    }

    /**
     * Clear verification token
     */
    clearToken() {
        this.verificationToken = null;
        this.tokenExpiry = null;
        localStorage.removeItem('face_verification_token');
        localStorage.removeItem('face_verification_expiry');
    }

    /**
     * Update status text
     */
    updateStatus(message, type = 'info') {
        if (this.statusElement) {
            this.statusElement.textContent = message;
            this.statusElement.className = `face-status face-status-${type}`;
        }
        this.onStatusChange(message, type);
    }

    /**
     * Show result message
     */
    showResult(type, message) {
        if (this.resultElement) {
            this.resultElement.innerHTML = message;
            this.resultElement.className = `face-result face-result-${type}`;
            this.resultElement.style.display = 'block';
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopCamera();
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FaceVerificationManager;
}

// Global instance
window.FaceVerificationManager = FaceVerificationManager;
