# Tech Stack & Repository Structure
## Project: VoiceShield — Real-Time AI Voice Cloning & Impersonation Detection

---

## 1. High-Level Architecture

```
[Audio Source: file upload / mic stream / mock telephony feed]
              │
              ▼
     [Ingestion Service] ── WebSocket / REST
              │
              ▼
   [Feature Extraction Layer]
    (spectral + prosodic features)
              │
              ▼
   [Deepfake/Clone Classifier Model]
              │
              ▼
    [Risk Scoring Engine] ── contextual metadata
              │
              ▼
   [Alerting API] ──► [Dashboard UI] + [Webhook/SMS mock]
              │
              ▼
   [Privacy/Logging Layer] (features only, audio discarded)
```

## 2. Recommended Tech Stack

### 2.1 Machine Learning / Audio Analysis
- **Language:** Python 3.11
- **Core libraries:** `torchaudio`, `librosa`, `numpy`, `scipy`
- **Deepfake/spoof detection models (pick one to fine-tune or use as baseline):**
  - RawNet2 / RawNet3 (raw-waveform spoof classifiers)
  - AASIST (state-of-the-art anti-spoofing architecture)
  - Wav2Vec2 / WavLM embeddings + lightweight classifier head (fast to fine-tune in hackathon time)
- **Datasets for training/validation:** ASVspoof 2019/2021, "In-the-Wild" audio deepfake dataset, self-generated clones (via an open TTS/voice-cloning tool, used only for red-teaming your own detector)
- **Serving the model:** `TorchScript` or `ONNX Runtime` for fast inference

### 2.2 Backend / API Layer
- **Framework:** FastAPI (Python) — async, native WebSocket support, quick to demo
- **Real-time transport:** WebSocket for streaming verdicts; REST for single-clip analysis
- **Task queue (optional, if processing is heavy):** Redis + Celery, or simple `asyncio` background tasks for hackathon scale
- **Auth:** API key header for demo; JWT if you want to show enterprise-readiness

### 2.3 Frontend / Dashboard
- **Framework:** React + TypeScript (Vite)
- **UI kit:** Tailwind CSS + shadcn/ui for fast, clean components
- **Visualization:** `wavesurfer.js` for waveform display, `recharts` for live risk-score timeline
- **Real-time updates:** native WebSocket client or `socket.io-client`

### 2.4 Streaming / Telephony Simulation
- **For demo:** chunked file processing (simulate a live call by feeding a WAV file in 2–4s windows)
- **For "Phase 2" story (architecture slide only):** WebRTC / SIP trunk taps, Twilio Media Streams, or Asterisk/FreeSWITCH integration for real telephony

### 2.5 Data & Storage
- **Metadata/logs DB:** PostgreSQL (call metadata, risk scores, verdicts — never raw audio by default)
- **Feature cache (optional):** Redis for short-lived session state during a "call"
- **Object storage (optional, only if you keep audio for demo purposes):** local disk or S3-compatible bucket, clearly flagged as demo-only

### 2.6 Infrastructure / Deployment (demo-level)
- **Containerization:** Docker + docker-compose (one command to spin up backend + frontend + DB)
- **Hosting for demo:** any of — Render/Railway/Fly.io (backend), Vercel/Netlify (frontend)
- **CI (optional polish point):** GitHub Actions for lint/test on push

### 2.7 Privacy & Compliance Tooling
- Feature-only logging (store MFCC/embedding vectors, not raw waveforms) to demonstrate the "Privacy Module" from the problem statement
- Config flag for on-device/edge inference mode (even a stub) to show design awareness of DPDP Act-style data minimization

---

## 3. Suggested Repository Folder Structure

```
voiceshield/
├── README.md
├── docker-compose.yml
├── PRD.md
├── TECH_STACK.md
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint
│   │   ├── api/
│   │   │   ├── routes_analyze.py    # POST /analyze
│   │   │   └── routes_stream.py     # WebSocket streaming endpoint
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   ├── inference.py         # loads ONNX/TorchScript model, runs prediction
│   │   │   └── model_weights/       # saved model artifacts
│   │   ├── features/
│   │   │   ├── spectral.py          # spectral/artifact feature extraction
│   │   │   └── prosody.py           # pitch, pause, jitter/shimmer extraction
│   │   ├── risk_engine/
│   │   │   └── scoring.py           # combines model output + metadata → risk score
│   │   ├── privacy/
│   │   │   └── logging.py           # feature-only logging, audio discard policy
│   │   └── db/
│   │       ├── models.py            # SQLAlchemy models
│   │       └── session.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── ml/
│   ├── notebooks/                   # EDA, model experiments
│   ├── train.py                     # fine-tuning script (RawNet2/AASIST/Wav2Vec2 head)
│   ├── evaluate.py                  # accuracy/EER on ASVspoof subset
│   └── data/                        # (gitignored) dataset staging folder
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── RiskMeter.tsx
│   │   │   ├── WaveformPlayer.tsx
│   │   │   └── AlertBanner.tsx
│   │   ├── pages/
│   │   │   └── Dashboard.tsx
│   │   ├── hooks/
│   │   │   └── useVoiceStream.ts
│   │   └── api/
│   │       └── client.ts
│   ├── package.json
│   └── Dockerfile
│
└── docs/
    ├── architecture-diagram.png
    └── demo-script.md
```

---

## 4. Judge-Facing Talking Points (tie stack choices back to the problem statement)

- **Real-time claim:** FastAPI + WebSocket streaming + ONNX inference = sub-3-second verdicts, matching the "before sensitive action is taken" requirement.
- **Multilingual/Indian accents:** raw-waveform/embedding-based models (RawNet2/Wav2Vec2) don't depend on ASR or language-specific transcription, so the same pipeline generalizes across languages and accents — directly answers the "diverse Indian accents and dialects" requirement.
- **Privacy-preserving:** feature-only logging + optional on-device inference stub map directly to the "Privacy and Compliance Module" in the problem statement.
- **Integration-ready:** a documented REST/WebSocket API is your stand-in for the "APIs and SDKs for banking/enterprise/telecom integration" requirement — show a mock banking-app screen calling it live.
