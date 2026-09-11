# VoiceGuard AI — Real-Time Voice Cloning & Impersonation Detection Platform
**SIH 2026 Problem Statement ID:** 26104 | **Theme:** Cybersecurity / Financial Fraud Prevention

---

## 1. Overview & Vision

**VoiceGuard AI** is an enterprise-grade real-time AI voice spoofing and deepfake detection platform designed to protect financial institutions, contact centers, and enterprises against synthetic speech impersonation fraud.

With neural text-to-speech (TTS) and zero-shot voice cloning tools capable of replicating an executive or customer voice from seconds of audio, legacy voice verification fails. VoiceGuard AI continuously analyzes incoming audio streams in rolling 2–4 second windows, calculates multi-vector risk scores, and transparently triggers verification or disconnection workflows **before unauthorized money or sensitive credentials move**.

---

## 2. Architecture & Design System

### Visual Design System (from Stitch UI Master System)
- **Primary Color:** Deep Navy `#0F172A` (authority, primary navigation, headers)
- **Secondary Action Color:** Vibrant Teal `#0D9488` / `#006A61` (secure verification state, active waveforms)
- **Background:** Off-white `#F7F9FB`
- **Threat State Colors:** Red `#BA1A1A` and Amber `#EAB308` reserved strictly for threat alerts
- **Typography:** `Inter` for UI clarity and `JetBrains Mono` for system status indicators (`VERIFYING...`, `THREAT_DETECTED`, `PCM 16kHz`)

### Multi-Vector Detection Pipeline
```
[Audio Feed: Microphone / WebRTC / PSTN Stream / WAV Upload]
                       │
                       ▼
          [Real-Time Ingestion Gateway]
              (FastAPI WebSocket / REST)
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
[Spectral Feature Extractor]   [Prosodic Feature Extractor]
- Spectral Centroid / Rolloff  - F0 Pitch Contour & Vibrato
- Spectral Flatness Entropy    - Jitter & Shimmer Perturbations
- High-Freq Vocoder Artifacts  - Unnatural Pause Ratio
       │                               │
       └───────────────┬───────────────┘
                       ▼
       [Hybrid Classifier Layer: RawNet2 / AASIST]
                       │
                       ▼
       [Multi-Vector Risk Scoring Engine (0-100)]
   (Classifier 45% + Spectral 25% + Prosody 15% + Context 15%)
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
[Alerting & UI Dashboard]      [Privacy Layer: DPDP Act]
- Real-time Waveform           - Discards raw audio buffers
- Active Interception Panel    - Logs derived feature vectors only
- Bank Wire Freeze Simulator   - MySQL 8 InnoDB ACID Persistence
```

---

## 3. Technology Stack

- **Backend:** FastAPI (Python 3.11/3.13), Uvicorn (Async), WebSockets, NumPy, SciPy
- **Database:** MySQL 8 with InnoDB engine, SQLModel + PyMySQL ORM layer (with automatic zero-config SQLite fallback for local developer testing)
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, wavesurfer.js
- **Payments:** Razorpay Gateway (India UPI/Cards/NetBanking) with server-side HMAC-SHA256 signature verification & idempotent webhooks
- **Infrastructure:** Docker & Docker Compose multi-service deployment

---

## 4. Quickstart & Running Locally

### Option A: Docker Compose (One-Command Launch)
```bash
docker-compose up --build
```
- **Frontend:** `http://localhost:5173`
- **Backend API Docs:** `http://localhost:8000/docs`
- **MySQL:** `localhost:3306`

### Option B: Local Developer Mode

#### 1. Backend Setup:
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Generate demo audio files (genuine, deepfake, borderline)
python backend/generate_demo_audio.py

# Run backend service
uvicorn app.main:app --app-dir backend --reload --port 8000
```

#### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

#### 3. Run Backend Test Suite:
```bash
$env:PYTHONPATH="backend"
pytest backend/tests -v
```

---

## 5. Judge & Demo Walkthrough Script

1. **Overview & Landing Page (`/`):**
   - View the live analysis stream preview animating in real-time.
   - Use the **Interactive Audio Playground** on the landing page to test Organic Human vs. Deepfake Clone audio with immediate vector feedback.
2. **Launch Dashboard (`/dashboard`):**
   - Click **"Deepfake Attack (88% Threat)"** in the simulation toolbar. Watch the waveform center spike in red, the risk score rise to 88/100, and the **"Terminate Connection"** trigger fire.
   - Click **"Genuine Human (12% Clear)"** to observe the green authentic state and low anomaly metrics.
   - Click **"Upload WAV"** to test custom voice recordings.
3. **Core Banking Wire-Transfer Interception Simulator (`/api-sandbox`):**
   - Click **"Launch Bank Demo"** with an AI Cloned voice.
   - Watch the corporate wire authorization automatically freeze a ₹500,000 transfer before debit occurs.
4. **Analytics & Historical Intelligence (`/analytics`):**
   - Inspect risk trajectory time-series, verdict distribution, false-positive metrics, and export audit logs as CSV.
5. **Subscriptions & Razorpay Checkout (`/pricing`):**
   - Select the Pro Shield or Enterprise Sentinel tier to test the Razorpay payment modal and server-side signature verification.
   - Generate and manage external `X-API-Key` headers for banking software integration.

---

## 6. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` or `/analyze` | Single audio file or chunk spoof analysis |
| `POST` | `/api/analyze/json` | Base64 audio payload analysis for programmatic clients |
| `WS` | `/ws/stream` | WebSocket for rolling 2–4s streaming analysis |
| `POST` | `/api/auth/login` | JWT User Authentication |
| `POST` | `/api/auth/api-keys` | Generate external integration API key |
| `GET` | `/api/logs` | Paginated detection logs |
| `GET` | `/api/logs/analytics` | Statistical analytics & risk trajectory |
| `POST` | `/api/payments/create-order` | Create Razorpay order |
| `POST` | `/api/payments/verify` | Server-side HMAC-SHA256 signature verification |
| `POST` | `/api/payments/webhook` | Idempotent Razorpay event webhook receiver |
