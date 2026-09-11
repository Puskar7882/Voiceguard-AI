from typing import Dict, Any, Optional

def calculate_risk_score(
    model_deepfake_prob: float,
    spectral_features: Dict[str, Any],
    prosodic_features: Dict[str, Any],
    context_metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Classifier-Primary Risk Scoring Engine.

    The trained Wav2Vec2 + MLP classifier's deepfake_probability is the
    sole authority on genuine vs. synthetic voice detection.

    - risk_score is a direct function of the classifier output (0–100).
    - Spectral and prosodic features are retained as diagnostic telemetry
      for the frontend dashboard but do NOT influence the verdict.
    - A small contextual bias (±5 pts max) is applied for high-risk
      banking actions like fund_transfer or password_reset.
    """
    context = context_metadata or {}
    caller_id = context.get("caller_id", "UNKNOWN")
    action_type = context.get("action_type", "standard_call")
    is_known_spoof_pattern = context.get("known_spoof_pattern", False)

    # ─── Primary Signal: Trained Classifier Probability ───
    # model_deepfake_prob is in [0.0, 1.0] from the Wav2Vec2 + MLP head
    base_risk = model_deepfake_prob * 100.0

    # ─── Small Contextual Adjustment (±5 pts max) ───
    contextual_nudge = 0.0
    if is_known_spoof_pattern:
        contextual_nudge = 5.0
    if action_type in ["fund_transfer", "wire_approval", "password_reset", "credential_reset"]:
        contextual_nudge = max(contextual_nudge, 3.0)

    final_risk_score = round(float(min(100.0, max(0.0, base_risk + contextual_nudge))), 1)

    # ─── Verdict Thresholds ───
    if final_risk_score >= 70.0:
        verdict = "Deepfake"
        vector_status = "Threat Detected"
        action_taken = "Terminated"
        recommendation = (
            "CRITICAL: Synthetic voice clone detected by neural classifier. "
            "Terminate connection immediately and require in-branch biometric "
            "or registered out-of-band OTP verification."
        )
        alert_level = "HIGH"
    elif final_risk_score >= 35.0:
        verdict = "Suspicious"
        vector_status = "Investigating"
        action_taken = "Flagged"
        recommendation = (
            "WARNING: Neural classifier detected acoustic inconsistencies "
            "suggestive of voice synthesis. Place call on hold and trigger "
            "mandatory secondary identity verification before proceeding."
        )
        alert_level = "MEDIUM"
    else:
        verdict = "Verified"
        vector_status = "Clear"
        action_taken = "Allowed"
        recommendation = (
            "AUTHENTIC: Neural classifier confirms voice acoustic profile "
            "matches organic human characteristics. Normal workflow approved."
        )
        alert_level = "LOW"

    # ─── Diagnostic Feature Telemetry ───
    # Raw spectral/prosodic features are kept for the frontend visualizer
    # panels, but their score/status fields reflect the CLASSIFIER verdict
    # (not independent heuristic thresholds) to maintain consistency.
    spectral_raw = float(spectral_features.get("spectral_anomaly_score", 0.0))
    prosody_raw = float(prosodic_features.get("prosody_unnaturalness_score", 0.0))

    # Cross-session linking score (contextual)
    cross_session_score = 10.0
    if is_known_spoof_pattern:
        cross_session_score = 90.0
    elif "INT_" in caller_id or "EXEC_" in caller_id:
        cross_session_score = 25.0

    # Derive vector statuses from the classifier's risk score for consistency
    def _vector_status(score: float) -> str:
        if final_risk_score >= 70:
            return "Threat Detected"
        elif final_risk_score >= 35:
            return "Investigating"
        return "Clear"

    return {
        "risk_score": final_risk_score,
        "verdict": verdict,
        "vector_status": vector_status,
        "action_taken": action_taken,
        "alert_level": alert_level,
        "recommendation": recommendation,
        "vectors": {
            "acoustic_anomaly": {
                "score": round(final_risk_score * 0.95, 1),  # Closely mirrors classifier
                "status": _vector_status(final_risk_score),
                "detail": (
                    "Synthetic signature match found in neural acoustic embedding space."
                    if final_risk_score >= 50
                    else "Acoustic embedding within natural biological dispersion limits."
                )
            },
            "prosody_score": {
                "score": round(final_risk_score * 0.90, 1),  # Closely mirrors classifier
                "status": _vector_status(final_risk_score),
                "detail": (
                    "Neural classifier detected prosodic patterns consistent with voice synthesis."
                    if final_risk_score >= 50
                    else "Natural pitch variation and conversational cadence verified by classifier."
                )
            },
            "cross_session_link": {
                "score": round(cross_session_score, 1),
                "status": (
                    "Threat Detected" if cross_session_score > 70
                    else ("Investigating" if cross_session_score > 35 else "Clear")
                ),
                "detail": (
                    "High-risk target profile flagged across correlated sessions."
                    if cross_session_score > 50
                    else "No known malicious sessions linked to this endpoint."
                )
            }
        },
        # Expose raw diagnostic features for frontend telemetry panels
        "_diagnostics": {
            "classifier_raw_prob": round(model_deepfake_prob, 4),
            "heuristic_spectral_anomaly": round(spectral_raw, 1),
            "heuristic_prosody_unnaturalness": round(prosody_raw, 1),
            "contextual_nudge_applied": round(contextual_nudge, 1)
        }
    }
