# 🔐 Face Verification: The Future of Decentralized Identity (VotEth)

## The "One Person, One Vote" Challenge
In the world of blockchain, "identity" is just a wallet address. But for a democratic voting system, that's a massive problem. How do you prevent one person from generating 100 wallets and casting 100 votes (a Sybil attack)?

Traditional solutions—like KYC (uploading passports) or centralized databases—defeat the purpose of privacy and decentralization. **We built something better.**

---

## 🚀 Introducing Logic-Locked Biometric Voting

We have integrated a **Privacy-Preserving Face Verification Layer** directly into the VotEth dApp. It acts as a secure gatekeeper between the physical world and the blockchain.

### How It Works (The "Human" Explained)

Instead of just checking if you have a wallet, VotEth now checks if *you are you*.

1.  **Enrollment (The One-Time Setup)**
    *   You register your face *once*.
    *   We don't just save your photo. Our AI scans your facial geometry and converts it into a **512-dimensional mathematical vector** (an "embedding").
    *   This embedding is cryptographically linked to your wallet address.

2.  **Verification (The Login)**
    *   When you want to vote, you click "Verify Face".
    *   Our AI compares your live camera feed against that stored mathematical vector.
    *   If—and *only* if—there is a **>70% geometric match**, the system issues a temporary "Access Token" (JWT).

3.  **The "Liveness" Check (Anti-Spoofing)**
    *   *Can I just hold up a photo of someone?* **No.**
    *   Our system uses advanced computer vision to detect "Liveness". It looks for:
        *   Micro-movements and blood flow patterns (subtle color changes).
        *   Pixel depth and sharpness (rejecting blurry screens).
        *   Reflections and glare typical of phone screens.

4.  **The Vote**
    *   Only with a valid Access Token can you interact with the voting smart contract. The blockchain remains anonymous, but the *gate* to enter is strictly verified.

---

## 🛠️ Under the Hood: The Tech Stack

This isn't just a wrapper around an API. It's a custom-built, high-performance biometric engine.

*   **Brain**: We use **InsightFace (buffalo_l)**, an industrial-grade analytical model used by top security firms. It runs on **ONNX Runtime** for millisecond-precision inference.
*   **Heart**: The backend is built on **FastAPI (Python)**, capable of handling thousands of verification requests asynchronously.
*   **Memory**: User embeddings are stored in a local, encrypted **SQLite** database (GDPR-compliant deletion is built-in).
*   **Shield**: **JWT (JSON Web Tokens)** ensure that once verified, your session is secure and time-limited (10 minutes), minimizing exposure.

## 🌍 Why This Matters

This feature bridges the gap between Web2 usability and Web3 security.
*   **No Passwords**: Your face is your key.
*   **No Central Authority**: You don't need a government ID to prove you exist.
*   **Zero-Knowledge Potential**: In future iterations, we can verify the *proof* of identity on-chain without ever revealing the identity itself.

Welcome to the future of secure, Sybil-resistant digital democracy.

---
*Built with ❤️ by the VotEth Team*
