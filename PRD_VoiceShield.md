# Product Requirements Document (PRD)
## Project: VoiceShield — Real-Time AI Voice Cloning & Impersonation Detection

**SIH Problem ID:** 104 (SIH-linked reference)
**Theme:** Cybersecurity / Fraud Prevention
**Document Owner:** Team [Your Team Name]
**Version:** 1.0

---

## 1. Problem Summary

Neural voice-cloning tools can now replicate a person's voice from a few seconds of audio, and attackers are using this to impersonate executives, officials, and trusted contacts to authorize fraudulent transfers or extract sensitive data. Legacy verification (caller ID, call-back, "I know that voice") no longer holds up against synthetic speech, especially under social-engineering pressure. There is no widely deployed system that scores voice authenticity **while a call is happening** and nudges the human toward safe action before money or data moves.

## 2. Vision

Give any bank, enterprise, or government call center a drop-in layer that listens to a live voice stream, continuously outputs an "is this a cloned/synthetic voice" risk score, and triggers a verification workflow before a risky action (fund transfer, credential reset, confidential disclosure) is approved.

## 3. Goals & Non-Goals (Hackathon Scope)

**In scope for MVP (36–48 hr build):**
- Upload or stream a short audio clip → binary classification (genuine vs. AI-generated/cloned) + confidence score.
- Near-real-time chunked analysis (simulate streaming by processing rolling 2–4 second windows).
- Simple risk-scoring engine with configurable threshold.
- Alert UI: dashboard showing live risk score, waveform, and a "flagged" banner + recommended action (call-back, OTP, escalate).
- Basic multilingual/accent robustness demo (test on 2–3 Indian-accented English/Hindi samples).
- API endpoint so the detector can be called from any client (bank app, contact-center software, telecom system).

**Explicitly out of scope for MVP (mention in roadmap only):**
- Production-grade telecom/VoIP carrier integration (SS7, live PSTN tap).
- Full on-device/edge inference optimization.
- Enterprise SSO, multi-tenant admin console.
- Formal regulatory/compliance certification (RBI/DPDP audit).

## 4. Target Users / Personas

| Persona | Need |
|---|---|
| Bank contact-center agent | Wants a visible, simple risk flag during a live call before approving a transfer. |
| Enterprise IT/Security team | Wants an API/SDK to bolt onto existing collaboration/telephony tools. |
| CXO / high-value individual | Wants protection from being impersonated to their own staff. |
| Telecom operator | Wants a reusable fraud-signal layer to offer as a value-added service. |

## 5. Functional Requirements

1. **Audio Ingestion**
   - Accept audio via file upload (demo) and streaming input (WebSocket/WebRTC) for live simulation.
   - Support common codecs (WAV, MP3, PCM 16-bit 16kHz).
2. **Voice Authenticity Analysis**
   - Extract acoustic/spectral features (e.g., spectrogram artifacts, phase discontinuities).
   - Extract prosodic features (pitch contour, pause patterns, jitter/shimmer).
   - Run classifier(s) to output a probability of "synthetic/cloned."
3. **Risk Scoring Engine**
   - Combine model confidence + contextual metadata (is this a known/verified number, is a high-value action pending) into a single risk score (0–100).
   - Configurable thresholds (Low / Medium / High) mapped to actions.
4. **Alerting Layer**
   - Real-time UI indicator (color-coded risk meter).
   - Trigger message/action recommendation when threshold is crossed (e.g., "Ask caller to verify via registered OTP").
5. **Cross-Session Check (stretch)**
   - If a reference sample of the genuine speaker exists, compare embeddings for identity consistency.
6. **APIs/SDKs**
   - REST endpoint: `POST /analyze` (audio chunk in) → `{ risk_score, verdict, features }`.
   - WebSocket endpoint for streaming verdicts during a call.
7. **Privacy Controls**
   - Option to discard raw audio after feature extraction; log only derived features + verdict.

## 6. Non-Functional Requirements

- **Latency:** verdict per audio chunk in < 2–3 seconds (near real time for demo).
- **Accuracy target for demo:** clearly show detection working on known spoof datasets (e.g., ASVspoof samples) with a stated accuracy/EER figure.
- **Scalability (design-level, not built):** stateless inference service so it can horizontally scale behind a load balancer.
- **Privacy:** no permanent storage of raw voice by default; feature-only logging option.
- **Multilingual:** design feature extraction to be language-agnostic (works on raw acoustic signal, not ASR-dependent).

## 7. Core User Flow (Demo Script)

1. Judge/operator opens the dashboard.
2. Plays or streams a genuine sample → dashboard shows low risk score, green state.
3. Plays a cloned/synthetic sample (pre-generated with an open TTS/voice-clone tool for demo purposes) → risk score climbs, banner turns red, recommended action appears ("Escalate — request call-back verification").
4. Show the same flow going through the REST API from a mock "banking app" screen, proving integration-readiness.

## 8. Success Metrics (for judging & for the pitch)

- Detection accuracy / Equal Error Rate on a public spoof-detection benchmark subset.
- End-to-end latency per chunk.
- Demonstrated false-positive control (genuine accented Indian voices not flagged).
- Clarity of the "before money moves" intervention story — this is the differentiator judges will remember.

## 9. Risks & Assumptions

| Risk | Mitigation |
|---|---|
| No real cloned-call dataset with Indian accents | Use ASVspoof / In-the-Wild deepfake audio datasets + self-generate clones with open TTS tools for demo variety. |
| Real-time streaming is hard to fully build in hackathon time | Simulate streaming via chunked file processing; be transparent about this in the pitch. |
| False positives could break trust | Present risk score as a decision-support signal, not an autonomous blocker — always pair with a human verification step. |
| Judges probe on production telecom integration | Have a clear "Phase 2" architecture slide showing SBC/telecom tap points, without claiming it's built. |

## 10. Roadmap

- **Phase 0 (Hackathon):** Upload/stream demo, single strong classifier, risk dashboard, REST API.
- **Phase 1 (Post-hackathon MVP):** Real WebRTC/SIP integration, multi-model ensemble, speaker-embedding cross-check.
- **Phase 2:** Telecom/enterprise SDKs, on-device inference, compliance hardening (DPDP Act alignment), pilot with a bank/enterprise partner.
