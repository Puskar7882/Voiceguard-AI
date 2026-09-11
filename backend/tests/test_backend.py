import pytest
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import init_db
from app.features.spectral import compute_spectral_features
from app.features.prosody import compute_prosodic_features
from app.risk_engine.scoring import calculate_risk_score
from app.models.inference import HybridRawNetClassifier

init_db()
client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_spectral_feature_extraction():
    t = np.linspace(0, 1.0, 16000, endpoint=False)
    samples = 0.5 * np.sin(2 * np.pi * 440 * t).astype(np.float32)
    feats = compute_spectral_features(samples, sample_rate=16000)
    
    assert "spectral_centroid" in feats
    assert "spectral_rolloff" in feats
    assert "spectral_flatness" in feats
    assert "high_freq_artifacts" in feats
    assert "spectral_anomaly_score" in feats

def test_prosodic_feature_extraction():
    t = np.linspace(0, 1.0, 16000, endpoint=False)
    samples = 0.5 * np.sin(2 * np.pi * 200 * t).astype(np.float32)
    feats = compute_prosodic_features(samples, sample_rate=16000)

    assert "f0_mean_hz" in feats
    assert "jitter_percent" in feats
    assert "shimmer_percent" in feats
    assert "prosody_unnaturalness_score" in feats

def test_risk_scoring_engine():
    spectral = {"spectral_anomaly_score": 90.0}
    prosody = {"prosody_unnaturalness_score": 85.0}
    
    res_high = calculate_risk_score(
        model_deepfake_prob=0.95,
        spectral_features=spectral,
        prosodic_features=prosody,
        context_metadata={"caller_id": "INT_44021"}
    )
    assert res_high["risk_score"] >= 70.0
    assert res_high["verdict"] == "Deepfake"
    assert res_high["vector_status"] == "Threat Detected"
    assert res_high["action_taken"] == "Terminated"

    res_low = calculate_risk_score(
        model_deepfake_prob=0.05,
        spectral_features={"spectral_anomaly_score": 10.0},
        prosodic_features={"prosody_unnaturalness_score": 8.0},
        context_metadata={"caller_id": "UNK_88291"}
    )
    assert res_low["risk_score"] < 35.0
    assert res_low["verdict"] == "Verified"
    assert res_low["action_taken"] == "Allowed"

def test_analyze_endpoint():
    response = client.post("/analyze")
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert "verdict" in data
    assert "vectors" in data
    assert data["privacy_compliance"]["raw_audio_discarded"] is True

def test_auth_and_logs():
    # Login as seed admin
    login_resp = client.post("/api/auth/login", json={"email": "admin@voiceguard.ai", "password": "voiceguard2026"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert token is not None

    # Fetch logs
    logs_resp = client.get("/api/logs", headers={"Authorization": f"Bearer {token}"})
    assert logs_resp.status_code == 200
    assert "logs" in logs_resp.json()
    assert len(logs_resp.json()["logs"]) > 0

def test_razorpay_order_and_verify():
    login_resp = client.post("/api/auth/login", json={"email": "admin@voiceguard.ai", "password": "voiceguard2026"})
    token = login_resp.json()["access_token"]

    # 1. Create order
    order_resp = client.post(
        "/api/payments/create-order",
        json={"plan_name": "Enterprise Sentinel", "amount": 49999.0},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert order_resp.status_code == 200
    order_data = order_resp.json()
    assert "order_id" in order_data

    # 2. Verify payment
    verify_resp = client.post(
        "/api/payments/verify",
        json={
            "razorpay_order_id": order_data["order_id"],
            "razorpay_payment_id": "pay_test_sih2026_unit_test",
            "razorpay_signature": "sandbox_test_signature",
            "plan_name": "Enterprise Sentinel",
            "amount": 49999.0
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["status"] == "success"
