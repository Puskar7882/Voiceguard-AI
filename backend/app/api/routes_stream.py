import asyncio
import json
import io
import wave
import base64
import time
import numpy as np
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlmodel import Session

from app.db.session import engine
from app.features.spectral import compute_spectral_features
from app.features.prosody import compute_prosodic_features
from app.models.inference import classifier
from app.risk_engine.scoring import calculate_risk_score
from app.privacy.logging import log_detection_privacy_safe
from app.api.routes_analyze import parse_audio_bytes

logger = logging.getLogger("VoiceGuard.Stream")
router = APIRouter(tags=["Real-time Stream"])

def _process_audio_window_sync(
    window: np.ndarray,
    sample_rate: int,
    caller_id: str,
    action_type: str,
    client_sent_ts: float | None = None
) -> dict:
    """
    Synchronous CPU-bound pipeline for feature extraction, inference, and scoring.
    Executed in a dedicated background thread via asyncio.to_thread so WebSocket event loop remains responsive.
    """
    t_start = time.perf_counter()

    # 1. Feature Extraction (Spectral & Prosody)
    t_feat_start = time.perf_counter()
    spectral_feats = compute_spectral_features(window, sample_rate=sample_rate)
    prosodic_feats = compute_prosodic_features(window, sample_rate=sample_rate)
    t_features_ms = (time.perf_counter() - t_feat_start) * 1000.0

    # 2. Model Inference (<5ms)
    t_inf_start = time.perf_counter()
    pred = classifier.predict(window, sample_rate=sample_rate)
    t_inference_ms = (time.perf_counter() - t_inf_start) * 1000.0

    # 3. Multi-Vector Risk Scoring
    t_risk_start = time.perf_counter()
    context = {
        "caller_id": caller_id,
        "action_type": action_type,
        "known_spoof_pattern": "INT_" in caller_id or "CLONE" in caller_id.upper()
    }
    risk_res = calculate_risk_score(
        model_deepfake_prob=pred["deepfake_probability"],
        spectral_features=spectral_feats,
        prosodic_features=prosodic_feats,
        context_metadata=context
    )
    t_risk_ms = (time.perf_counter() - t_risk_start) * 1000.0

    # 4. Privacy Safe Logging (Minimal feature persistence, no raw audio)
    t_db_start = time.perf_counter()
    log_id = None
    try:
        with Session(engine) as db:
            log_entry = log_detection_privacy_safe(
                db=db,
                user_id=None,
                caller_id=caller_id,
                risk_result=risk_res,
                spectral_features=spectral_feats,
                prosodic_features=prosodic_feats
            )
            log_id = log_entry.id
    except Exception as db_err:
        logger.error(f"Error saving privacy log: {db_err}")
    t_db_ms = (time.perf_counter() - t_db_start) * 1000.0

    t_total_backend_ms = (time.perf_counter() - t_start) * 1000.0

    # Audio metrics for HUD visualizer
    rms = float(np.sqrt(np.mean(window**2) + 1e-8))
    amp_db = round(float(20 * np.log10(rms + 1e-4) + 60), 1)
    f0_hz = prosodic_feats.get("f0_mean_hz", 180.0)

    timings = {
        "features_ms": round(t_features_ms, 2),
        "inference_ms": round(t_inference_ms, 2),
        "risk_scoring_ms": round(t_risk_ms, 2),
        "db_logging_ms": round(t_db_ms, 2),
        "backend_total_ms": round(t_total_backend_ms, 2),
        "client_sent_ts": client_sent_ts
    }

    return {
        "risk_res": risk_res,
        "pred": pred,
        "spectral_feats": spectral_feats,
        "prosodic_feats": prosodic_feats,
        "log_id": log_id,
        "f0_hz": f0_hz,
        "amp_db": amp_db,
        "timings": timings
    }

@router.websocket("/ws/stream")
async def websocket_audio_stream(websocket: WebSocket):
    """
    High-throughput, low-latency WebSocket endpoint for real-time streaming voice spoof detection.
    Features:
    - 1.5s–2.0s sliding analysis window with overlap for continuous detection
    - Non-blocking CPU execution offloaded via asyncio.to_thread
    - Millisecond-precision stage-by-stage latency logging
    - Instant client-side feedback & privacy compliance (zero raw audio persistence)
    """
    await websocket.accept()
    logger.info("WebSocket client connected to /ws/stream")
    
    # Internal rolling sample buffer for the active stream (up to ~2.5s context)
    buffer = []
    sample_rate = 16000
    session_caller_id = "LIVE_MIC_STREAM"
    chunk_counter = 0

    # Target sliding window size: 1.5s to 2.0s (24,000 to 32,000 samples @ 16kHz)
    ANALYSIS_WINDOW_SAMPLES = 24000  # 1.5 seconds @ 16kHz
    MIN_REQUIRED_SAMPLES = 16000     # 1.0 second minimum before first verdict

    try:
        while True:
            message = await websocket.receive()
            
            if "text" in message and message["text"]:
                data = message["text"]
                try:
                    msg = json.loads(data)
                except json.JSONDecodeError:
                    await websocket.send_json({"type": "error", "message": "Invalid JSON format"})
                    continue

                msg_type = msg.get("type", "chunk")
                
                if msg_type == "ping":
                    await websocket.send_json({"type": "pong", "ts": msg.get("ts")})
                    continue

                if msg_type == "start_simulation":
                    scenario = msg.get("scenario", "deepfake")
                    session_caller_id = msg.get("caller_id", "INT_44021" if scenario == "deepfake" else "UNK_88291")
                    buffer.clear()
                    chunk_counter = 0
                    await websocket.send_json({
                        "type": "simulation_started",
                        "scenario": scenario,
                        "caller_id": session_caller_id
                    })
                    continue

                if msg_type == "start_mic":
                    session_caller_id = msg.get("caller_id", "LIVE_MIC_USER")
                    buffer.clear()
                    chunk_counter = 0
                    logger.info(f"Started live microphone session for: {session_caller_id}")
                    await websocket.send_json({
                        "type": "mic_started",
                        "caller_id": session_caller_id,
                        "status": "ready"
                    })
                    continue

                if msg_type in ("mic_chunk", "audio_chunk"):
                    chunk_start_time = time.perf_counter()
                    chunk_b64 = msg.get("data", "")
                    chunk_caller = msg.get("caller_id", session_caller_id)
                    chunk_id = msg.get("chunk_id", chunk_counter + 1)
                    client_sent_ts = msg.get("client_ts")
                    chunk_counter += 1

                    # 1. Parse audio payload
                    t_parse_start = time.perf_counter()
                    if chunk_b64:
                        try:
                            raw_bytes = base64.b64decode(chunk_b64)
                            samples, sr = parse_audio_bytes(raw_bytes)
                            if sr != sample_rate and len(samples) > 0:
                                sample_rate = sr
                        except Exception as err:
                            logger.warning(f"Error parsing audio chunk: {err}")
                            samples = np.zeros(1600, dtype=np.float32)
                    else:
                        samples = np.zeros(1600, dtype=np.float32)
                    t_parse_ms = (time.perf_counter() - t_parse_start) * 1000.0

                    # 2. Add samples to rolling sliding window
                    buffer.extend(samples.tolist())

                    # Evaluate once we have reached the minimum analysis window threshold
                    if len(buffer) >= MIN_REQUIRED_SAMPLES:
                        window_samples = np.array(
                            buffer[-ANALYSIS_WINDOW_SAMPLES:],
                            dtype=np.float32
                        )

                        # Offload CPU calculations to background worker thread (non-blocking)
                        res = await asyncio.to_thread(
                            _process_audio_window_sync,
                            window=window_samples,
                            sample_rate=sample_rate,
                            caller_id=chunk_caller,
                            action_type=msg.get("action_type", "live_voice_verification"),
                            client_sent_ts=client_sent_ts
                        )

                        risk_res = res["risk_res"]
                        pred = res["pred"]
                        spectral_feats = res["spectral_feats"]
                        prosodic_feats = res["prosodic_feats"]
                        timings = res["timings"]
                        timings["parse_ms"] = round(t_parse_ms, 2)

                        # Log stage-by-stage timing breakdown
                        logger.info(
                            f"[Latency Profile] Chunk #{chunk_id} ({chunk_caller}) -> "
                            f"Parse: {timings['parse_ms']}ms | "
                            f"Features: {timings['features_ms']}ms | "
                            f"Infer: {timings['inference_ms']}ms | "
                            f"Risk: {timings['risk_scoring_ms']}ms | "
                            f"DB: {timings['db_logging_ms']}ms | "
                            f"Total Backend: {timings['backend_total_ms']}ms -> "
                            f"Score: {risk_res['risk_score']} ({risk_res['verdict']})"
                        )

                        # Send verdict back to WebSocket client immediately
                        await websocket.send_json({
                            "type": "mic_verdict",
                            "chunk_id": chunk_id,
                            "chunk_index": chunk_counter,
                            "caller_id": chunk_caller,
                            "risk_score": risk_res["risk_score"],
                            "verdict": risk_res["verdict"],
                            "vector_status": risk_res["vector_status"],
                            "action_taken": risk_res["action_taken"],
                            "alert_level": risk_res["alert_level"],
                            "recommendation": risk_res["recommendation"],
                            "confidence": pred["model_confidence"],
                            "vectors": risk_res["vectors"],
                            "features": {
                                "spectral": spectral_feats,
                                "prosody": prosodic_feats
                            },
                            "metrics": {
                                "frequency_hz": round(float(res["f0_hz"]), 1),
                                "amplitude_db": res["amp_db"],
                                "jitter": prosodic_feats["jitter_percent"],
                                "shimmer": prosodic_feats["shimmer_percent"]
                            },
                            "timings": timings,
                            "log_id": res["log_id"],
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        })

                        # Keep rolling buffer trimmed to 2.5 seconds (32,000 samples)
                        MAX_BUFFER_SAMPLES = int(sample_rate * 2.5)
                        if len(buffer) > MAX_BUFFER_SAMPLES:
                            buffer = buffer[-MAX_BUFFER_SAMPLES:]

                elif msg_type == "simulate_tick":
                    scenario = msg.get("scenario", "deepfake")
                    time_idx = msg.get("tick", 1)
                    
                    if scenario == "deepfake":
                        t = np.linspace(0, 0.5, 4000)
                        mock_samples = 0.6 * np.sin(2 * np.pi * 440 * t) + 0.3 * np.sign(np.sin(2 * np.pi * 880 * t))
                        prob = min(0.96, 0.65 + (time_idx * 0.05))
                        context = {"caller_id": "INT_44021", "known_spoof_pattern": True}
                    elif scenario == "borderline":
                        t = np.linspace(0, 0.5, 4000)
                        mock_samples = 0.4 * np.sin(2 * np.pi * 220 * t) + 0.2 * np.random.randn(len(t))
                        prob = 0.45 + (0.1 * np.sin(time_idx))
                        context = {"caller_id": "EXT_99210", "known_spoof_pattern": False}
                    else: # genuine
                        t = np.linspace(0, 0.5, 4000)
                        mock_samples = 0.5 * np.sin(2 * np.pi * 180 * t) + 0.05 * np.random.randn(len(t))
                        prob = max(0.04, 0.12 - (time_idx * 0.01))
                        context = {"caller_id": "UNK_88291", "known_spoof_pattern": False}

                    spectral_feats = compute_spectral_features(mock_samples, sample_rate=sample_rate)
                    prosodic_feats = compute_prosodic_features(mock_samples, sample_rate=sample_rate)
                    
                    risk_res = calculate_risk_score(
                        model_deepfake_prob=prob,
                        spectral_features=spectral_feats,
                        prosodic_features=prosodic_feats,
                        context_metadata=context
                    )

                    await websocket.send_json({
                        "type": "verdict_tick",
                        "caller_id": context["caller_id"],
                        "risk_score": risk_res["risk_score"],
                        "verdict": risk_res["verdict"],
                        "vector_status": risk_res["vector_status"],
                        "action_taken": risk_res["action_taken"],
                        "alert_level": risk_res["alert_level"],
                        "recommendation": risk_res["recommendation"],
                        "vectors": risk_res["vectors"],
                        "metrics": {
                            "frequency_hz": round(150.0 + np.random.rand() * 300, 1),
                            "amplitude_db": round(np.random.rand() * 4.0 - 1.0, 1),
                            "jitter": prosodic_feats["jitter_percent"],
                            "shimmer": prosodic_feats["shimmer_percent"]
                        },
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })

            elif "bytes" in message and message["bytes"]:
                raw_bytes = message["bytes"]
                chunk_counter += 1
                samples, sr = parse_audio_bytes(raw_bytes)
                buffer.extend(samples.tolist())

                if len(buffer) >= MIN_REQUIRED_SAMPLES:
                    window_samples = np.array(buffer[-ANALYSIS_WINDOW_SAMPLES:], dtype=np.float32)
                    res = await asyncio.to_thread(
                        _process_audio_window_sync,
                        window=window_samples,
                        sample_rate=sr,
                        caller_id=session_caller_id,
                        action_type="raw_stream"
                    )

                    risk_res = res["risk_res"]
                    pred = res["pred"]
                    spectral_feats = res["spectral_feats"]
                    prosodic_feats = res["prosodic_feats"]

                    await websocket.send_json({
                        "type": "mic_verdict",
                        "chunk_index": chunk_counter,
                        "caller_id": session_caller_id,
                        "risk_score": risk_res["risk_score"],
                        "verdict": risk_res["verdict"],
                        "vector_status": risk_res["vector_status"],
                        "action_taken": risk_res["action_taken"],
                        "alert_level": risk_res["alert_level"],
                        "recommendation": risk_res["recommendation"],
                        "vectors": risk_res["vectors"],
                        "metrics": {
                            "frequency_hz": round(float(res["f0_hz"]), 1),
                            "amplitude_db": res["amp_db"],
                            "jitter": prosodic_feats["jitter_percent"],
                            "shimmer": prosodic_feats["shimmer_percent"]
                        },
                        "timings": res["timings"],
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })

                    MAX_BUFFER_SAMPLES = int(sr * 2.5)
                    if len(buffer) > MAX_BUFFER_SAMPLES:
                        buffer = buffer[-MAX_BUFFER_SAMPLES:]

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected from /ws/stream")
    except Exception as exc:
        logger.error(f"WebSocket session error: {exc}")
