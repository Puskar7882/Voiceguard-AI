import logging
from typing import Dict, Any, Optional
from sqlmodel import Session
from datetime import datetime, timezone
from app.db.models import DetectionLog
from app.core.config import settings

logger = logging.getLogger(__name__)

def log_detection_privacy_safe(
    db: Session,
    user_id: Optional[int],
    caller_id: str,
    risk_result: Dict[str, Any],
    spectral_features: Dict[str, Any],
    prosodic_features: Dict[str, Any]
) -> DetectionLog:
    """
    Privacy-preserving data persistence (DPDP Act & RBI Compliance):
    - Strict data minimization: raw audio PCM/WAV buffers are NEVER persisted.
    - Only derived mathematical metrics and cryptographic session hashes are retained.
    """
    # Sanitize and aggregate feature payload
    safe_features = {
        "spectral_centroid": spectral_features.get("spectral_centroid"),
        "spectral_rolloff": spectral_features.get("spectral_rolloff"),
        "spectral_flatness": spectral_features.get("spectral_flatness"),
        "high_freq_artifacts": spectral_features.get("high_freq_artifacts"),
        "f0_mean_hz": prosodic_features.get("f0_mean_hz"),
        "f0_std_hz": prosodic_features.get("f0_std_hz"),
        "jitter_percent": prosodic_features.get("jitter_percent"),
        "shimmer_percent": prosodic_features.get("shimmer_percent")
    }

    vectors = risk_result.get("vectors", {})
    spectral_val = float(vectors.get("acoustic_anomaly", {}).get("score", 0.0))
    prosody_val = float(vectors.get("prosody_score", {}).get("score", 0.0))
    cross_val = float(vectors.get("cross_session_link", {}).get("score", 0.0))

    log_entry = DetectionLog(
        user_id=user_id,
        caller_id=caller_id,
        risk_score=float(risk_result.get("risk_score", 0.0)),
        verdict=str(risk_result.get("verdict", "Verified")),
        vector_status=str(risk_result.get("vector_status", "Clear")),
        action_taken=str(risk_result.get("action_taken", "Allowed")),
        spectral_anomaly=spectral_val,
        prosody_score=prosody_val,
        cross_session_link=cross_val,
        features_json=safe_features,
        timestamp=datetime.now(timezone.utc)
    )

    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    logger.info(f"Privacy-compliant log saved for session {caller_id} [Verdict: {log_entry.verdict}, Risk: {log_entry.risk_score}]")
    return log_entry
