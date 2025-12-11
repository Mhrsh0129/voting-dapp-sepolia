# 🗳️ VotEth - Decentralized Voting with Face Verification

**VotEth** is a cutting-edge decentralized voting application that combines the security and transparency of the **Ethereum Blockchain** with the identity assurance of **AI-Powered Face Verification**.

![VotEth Banner](https://via.placeholder.com/1200x400?text=VotEth:+Secure+Blockchain+Voting)

---

## 🌟 Key Features

### 🔐 Security First
*   **Blockchain Core**: All votes are recorded on the **Ethereum Sepolia Testnet**, ensuring they are immutable, transparent, and tamper-proof.
*   **Smart Contracts**: Logic is handled by Solidity contracts, automating the tallying and timing of elections.

### 👤 Identity & Sybil Resistance
*   **Face Verification Gate**: We solved the "one person, one vote" problem without centralized KYC.
*   **Liveness Detection**: Our AI checks for "liveness" (blinking, depth, micro-movements) to preventing spoofing with photos or videos.
*   **Privacy Preserving**: We store **mathematical face embeddings**, not actual photos. Your privacy is respected.

### 💻 User Experience
*   **Real-Time Analytics**: View vote counts and election status live.
*   **Multi-Language Support**: Fully localized for English and Hindi (easy to extend).
*   **Theme Support**: Toggle between Dark and Light modes.
*   **Wallet Integration**: Works seamlessly with MetaMask.

---

## 🛠️ Tech Stack

### 🔗 Blockchain
*   **Solidity**: Smart Contract development.
*   **Hardhat**: Development environment, testing, and deployment.
*   **Ethers.js**: Blockchain interaction from the client.

### 🧠 Artificial Intelligence (Face Service)
*   **Python (FastAPI)**: High-performance backend API.
*   **InsightFace**: Industry-grade face analysis and recognition.
*   **ONNX Runtime**: Optimized model inference.
*   **SQLite**: Local, encrypted storage for face embeddings.

### 🌐 Frontend
*   **HTML5 / CSS3**: Responsive, modern UI without heavy frameworks.
*   **JavaScript (ES6+)**: Core logic for wallet connection and API calls.
*   **Node.js**: Backend server for serving the application.

---

## 🚀 Getting Started

### Prerequisites
*   **Node.js** (v16+)
*   **Python** (v3.10+)
*   **MetaMask Extension** installed in your browser.

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/VotEth.git
    cd VotEth
    ```

2.  **Start Automagically ✨**
    We have a single script that sets up *everything* (Frontend, Backend, Smart Contracts).
    
    **Windows:**
    ```bash
    .\start.bat
    ```
    
    **Mac/Linux:**
    ```bash
    ./start.js
    ```

    *Follow the on-screen prompts to set the election duration.*

3.  **Access the App**
    *   **Voting App**: [http://localhost:3000](http://localhost:3000)
    *   **Face Enrollment**: [http://localhost:8000/enroll.html](http://localhost:8000/enroll.html)

---

## 📖 How to Use

### 1️⃣ Enroll Your Face (One-Time)
Before you can vote, you must register your face identity.
1.  Go to the **Enrollment Page**.
2.  Enter your **Wallet Address**.
3.  Capture your face.
4.  Success! You are now a verified voter.

### 2️⃣ Cast Your Vote
1.  Go to the **Main App**.
2.  Connect your **MetaMask Wallet**.
3.  Click **"Verify Face"**. The system will scan your face and ensure it matches the enrolled user.
4.  Once verified, enter the Candidate Index and click **"Vote"**.
5.  Confirm the transaction in MetaMask.

### 3️⃣ View Results
*   Once the election timer ends, results are automatically tallied and displayed on the dashboard.
*   You can also verify 100% of votes on Etherscan.

---

## 📂 Project Structure

```
VotEth/
├── contracts/          # Solidity Smart Contracts
├── scripts/            # Deployment & Automation scripts
├── face-service/       # Python AI Backend (Face Recognition)
│   ├── main.py         # FastAPI App
│   ├── face_processor.py # InsightFace Logic
│   └── enroll.html     # Enrollment Interface
├── index.html          # Main Voting UI
├── main.js             # Frontend Logic
└── start.js            # Master Startup Script
```

---

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a PR.

## 📄 License
This project is open-source.
