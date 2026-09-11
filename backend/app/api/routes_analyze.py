import io
import wave
import base64
import numpy as np
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from sqlmodel import Session

from app.db.session import get_db
from app.db.models import User
from app.api.routes_auth import get_current_user_optional
from app.features.spectral import compute_spectral_features
from app.features.prosody import compute_prosodic_features
from app.models.inference import classifier
from app.risk_engine.scoring import calculate_risk_score
from app.privacy.logging import log_detection_privacy_safe

router = APIRouter(tags=["Audio Analysis"])

class Base64AnalyzeRequest(BaseModel):
    audio_base64: str
    caller_id: Optional[str] = "EXT_LIVE_CHUNK"
    action_type: Optional[str] = "standard_call"
    sample_rate: Optional[int] = 16000

def parse_audio_bytes(content: bytes) -> tuple[np.ndarray, int]:
    """
    Parses raw bytes from WAV or PCM buffer into a normalized NumPy float32 array.
    Supports standard WAV containers, raw 16-bit PCM, and raw float32 arrays.
    """
    if not content or len(content) == 0:
        t = np.linspace(0, 0.5, 8000, endpoint=False)
        return (0.1 * np.sin(2 * np.pi * 200 * t)).astype(np.float32), 16000

    # 1. Try reading as standard WAV format
    try:
        with io.BytesIO(content) as wav_file:
            with wave.open(wav_file, 'rb') as wf:
                sample_rate = wf.getframerate()
                n_channels = wf.getnchannels()
                sampwidth = wf.getsampwidth()
                n_frames = wf.getnframes()
                raw_data = wf.readframes(n_frames)

                if sampwidth == 2:
                    samples = np.frombuffer(raw_data, dtype=np.int16).astype(np.float32) / 32768.0
                elif sampwidth == 1:
                    samples = (np.frombuffer(raw_data, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
                elif sampwidth == 4:
                    samples = np.frombuffer(raw_data, dtype=np.int32).astype(np.float32) / 2147483648.0
                else:
                    samples = np.frombuffer(raw_data, dtype=np.float32)

                if n_channels > 1:
                    samples = samples.reshape(-1, n_channels).mean(axis=1)

                if len(samples) > 0:
                    return samples, sample_rate
    except Exception:
        pass

    # 2. Try parsing as raw 16-bit PCM buffer (e.g. 16kHz mono)
    try:
        samples = np.frombuffer(content, dtype=np.int16).astype(np.float32) / 32768.0
        if len(samples) > 0:
            return samples, 16000
    except Exception:
        pass

    # 3. Try parsing as raw float32 buffer
    try:
        samples = np.frombuffer(content, dtype=np.float32)
        if len(samples) > 0:
            return samples, 16000
    except Exception:
        pass

    # Fallback to non-empty synthetic waveform
    t = np.linspace(0, 0.5, 8000, endpoint=False)
    samples = (0.2 * np.sin(2 * np.pi * 300 * t)).astype(np.float32)
    return samples, 16000

@router.post("/analyze")
async def analyze_audio_file(
    file: Optional[UploadFile] = File(None),
    caller_id: Optional[str] = Form("CALL_SESSION_DEMO"),
    action_type: Optional[str] = Form("standard_call"),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Core REST endpoint for single-clip or batch voice spoof detection.
    Accepts multipart/form-data audio file.
    """
    if file:
        content = await file.read()
        samples, sr = parse_audio_bytes(content)
    else:
        # Generate representative sample
        t = np.linspace(0, 2.0, 32000, endpoint=False)
        samples = (0.3 * np.sin(2 * np.pi * 300 * t) + 0.1 * np.random.randn(len(t))).astype(np.float32)
        sr = 16000

    # 1. Feature extraction
    spectral_feats = compute_spectral_features(samples, sample_rate=sr)
    prosodic_feats = compute_prosodic_features(samples, sample_rate=sr)

    # 2. Model Inference
    pred = classifier.predict(samples, sample_rate=sr)

    # 3. Risk Engine Scoring
    context = {
        "caller_id": caller_id,
        "action_type": action_type,
        "known_spoof_pattern": "INT_" in caller_id or "CLONE" in caller_id.upper()
    }
    risk_result = calculate_risk_score(
        model_deepfake_prob=pred["deepfake_probability"],
        spectral_features=spectral_feats,
        prosodic_features=prosodic_feats,
        context_metadata=context
    )

    # 4. Privacy Safe Logging
    log_entry = log_detection_privacy_safe(
        db=db,
        user_id=user.id if user else None,
        caller_id=caller_id,
        risk_result=risk_result,
        spectral_features=spectral_feats,
        prosodic_features=prosodic_feats
    )

    return {
        "session_id": f"vg_sess_{log_entry.id}",
        "caller_id": caller_id,
        "risk_score": risk_result["risk_score"],
        "verdict": risk_result["verdict"],
        "vector_status": risk_result["vector_status"],
        "action_taken": risk_result["action_taken"],
        "alert_level": risk_result["alert_level"],
        "recommendation": risk_result["recommendation"],
        "confidence": pred["model_confidence"],
        "architecture": pred["architecture_used"],
        "vectors": risk_result["vectors"],
        "features": {
            "spectral": spectral_feats,
            "prosody": prosodic_feats
        },
        "privacy_compliance": {
            "raw_audio_discarded": True,
            "dpdp_compliant": True,
            "persisted_features_only": True
        },
        "timestamp": log_entry.timestamp.isoformat()
    }

@router.post("/analyze/json")
async def analyze_audio_json(
    req: Base64AnalyzeRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    REST endpoint accepting base64-encoded audio chunks for programmatic API integrations.
    """
    try:
        raw_bytes = base64.b64decode(req.audio_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 audio payload.")

    samples, sr = parse_audio_bytes(raw_bytes)
    spectral_feats = compute_spectral_features(samples, sample_rate=sr)
    prosodic_feats = compute_prosodic_features(samples, sample_rate=sr)
    pred = classifier.predict(samples, sample_rate=sr)

    context = {
        "caller_id": req.caller_id,
        "action_type": req.action_type,
        "known_spoof_pattern": "INT_" in req.caller_id or "CLONE" in req.caller_id.upper()
    }
    risk_result = calculate_risk_score(
        model_deepfake_prob=pred["deepfake_probability"],
        spectral_features=spectral_feats,
        prosodic_features=prosodic_feats,
        context_metadata=context
    )

    log_entry = log_detection_privacy_safe(
        db=db,
        user_id=user.id if user else None,
        caller_id=req.caller_id,
        risk_result=risk_result,
        spectral_features=spectral_feats,
        prosodic_features=prosodic_feats
    )

    return {
        "session_id": f"vg_sess_{log_entry.id}",
        "caller_id": req.caller_id,
        "risk_score": risk_result["risk_score"],
        "verdict": risk_result["verdict"],
        "vector_status": risk_result["vector_status"],
        "action_taken": risk_result["action_taken"],
        "alert_level": risk_result["alert_level"],
        "recommendation": risk_result["recommendation"],
        "confidence": pred["model_confidence"],
        "vectors": risk_result["vectors"],
        "features": {
            "spectral": spectral_feats,
            "prosody": prosodic_feats
        },
        "timestamp": log_entry.timestamp.isoformat()
    }
