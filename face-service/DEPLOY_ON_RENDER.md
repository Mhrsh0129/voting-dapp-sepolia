# Deploying Backend to Render (Free Cloud)

Since your frontend is on Vercel, the Face Verification Backend (Python) needs its own server. **Render.com** is the best free option for this.

## 1. Prepare your GitHub
Ensure your latest code (including `face-service/requirements-prod.txt`) is pushed to GitHub.

## 2. Create Service on Render
1.  **Log in** to [dashboard.render.com](https://dashboard.render.com/).
2.  Click **New +** -> **Web Service**.
3.  Select **"Build and deploy from a Git repository"**.
4.  Connect your repository (`voting-dapp-sepolia`).

## 3. Configure the Service
Fill in the details exactly like this:

| Setting | Value |
| :--- | :--- |
| **Name** | `voteth-face-service` (or any name) |
| **Region** | Any (e.g., Singapore/Ohio) |
| **Branch** | `main` |
| **Root Directory** | `face-service` |
| **Runtime** | **Python 3** |
| **Build Command** | `pip install -r requirements-prod.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | **Free** |

## 4. Environment Variables
Scroll down to **"Advanced"** or **"Environment Variables"** and add these:

| Key | Value |
| :--- | :--- |
| `PYTHON_VERSION` | `3.9.0` (or 3.10.0) |
| `JWT_SECRET_KEY` | (Generate a random string) |
| `CORS_ORIGINS` | `*` (or your Vercel URL `https://vot-eth.vercel.app`) |

## 5. Deploy
Click **Create Web Service**.
*   Render will clone your repo, install dependencies, and start the server.
*   **Wait**: The first build might take 5-10 minutes as it downloads InsightFace models.
*   **Success**: You will see "Your service is live" and a URL like `https://voteth-face-service.onrender.com`.

## 6. Update Frontend
Once you have the new Backend URL:
1.  Open your local `main.js`.
2.  Find the Face Verification section (or `index.html`).
3.  Update the API URL:
    ```javascript
    // In index.html / initFaceVerification()
    faceVerificationManager = new FaceVerificationManager({
        apiUrl: 'https://voteth-face-service.onrender.com', // <--- YOUR NEW URL
        // ...
    });
    ```
4.  Commit and push to GitHub. Vercel will auto-update the frontend.

---

### ⚠️ Important Limitations (Free Tier)
1.  **Spin Down**: If no one uses it for 15 minutes, the server sleeps. It takes **50 seconds** to wake up when you first visit it.
2.  **Database Wipe**: The SQLite database (`face_data.db`) is **deleted** every time the server restarts.
    *   *Solution*: For a permanent demo, use Render's **PostgreSQL** service (Free tier available) and update `DATABASE_URL` in env vars.
