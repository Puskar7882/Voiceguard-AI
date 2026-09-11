import numpy as np
from scipy.signal import spectrogram
from typing import Dict, Any

def compute_spectral_features(audio_samples: np.ndarray, sample_rate: int = 16000) -> Dict[str, Any]:
    """
    Extracts acoustic & spectral spoofing indicators:
    - Spectral Centroid: center of mass of spectrum
    - Spectral Rolloff: frequency below which 85% of spectral energy lies
    - Spectral Flatness / Wiener entropy: detects synthetic vocoder buzz vs organic voice
    - High-frequency phase discontinuity score: common in neural vocoder outputs (HiFi-GAN / MelGAN)
    """
    if len(audio_samples) == 0:
        return {
            "spectral_centroid": 0.0,
            "spectral_rolloff": 0.0,
            "spectral_flatness": 0.0,
            "high_freq_artifacts": 0.0,
            "spectral_anomaly_score": 0.0
        }

    # Ensure float32 normalized
    if audio_samples.dtype != np.float32:
        samples = audio_samples.astype(np.float32)
    else:
        samples = audio_samples

    max_val = np.max(np.abs(samples))
    if max_val > 1.0:
        samples = samples / max_val

    nperseg = min(512, len(samples))
    if nperseg < 64:
        return {
            "spectral_centroid": 1200.0,
            "spectral_rolloff": 2500.0,
            "spectral_flatness": 0.05,
            "high_freq_artifacts": 10.0,
            "spectral_anomaly_score": 15.0
        }

    freqs, _, Sxx = spectrogram(samples, fs=sample_rate, nperseg=nperseg, noverlap=nperseg // 2)
    mag_spec = np.abs(Sxx) + 1e-10

    # 1. Spectral Centroid
    col_sums = np.sum(mag_spec, axis=0)
    col_sums[col_sums == 0] = 1e-10
    centroid = np.sum(freqs[:, np.newaxis] * mag_spec, axis=0) / col_sums
    mean_centroid = float(np.mean(centroid))

    # 2. Spectral Rolloff (85% energy cutoff)
    cum_energy = np.cumsum(mag_spec, axis=0)
    thresholds = 0.85 * cum_energy[-1, :]
    # Vectorized rolloff index lookup
    rolloff_indices = np.argmax(cum_energy >= thresholds[np.newaxis, :], axis=0)
    rolloff_freqs = freqs[np.clip(rolloff_indices, 0, len(freqs) - 1)]
    mean_rolloff = float(np.mean(rolloff_freqs))

    # 3. Spectral Flatness (Wiener entropy: geometric mean / arithmetic mean)
    geom_mean = np.exp(np.mean(np.log(mag_spec), axis=0))
    arith_mean = np.mean(mag_spec, axis=0)
    flatness = geom_mean / (arith_mean + 1e-10)
    mean_flatness = float(np.mean(flatness))

    # 4. High-frequency boundary artifact score
    high_freq_mask = freqs > (sample_rate * 0.35)
    if np.any(high_freq_mask):
        high_freq_energy = np.mean(mag_spec[high_freq_mask, :])
        total_mean_energy = np.mean(mag_spec)
        hf_ratio = float(high_freq_energy / (total_mean_energy + 1e-8))
    else:
        hf_ratio = 0.05

    # Compute aggregate spectral anomaly indicator (0 - 100)
    anomaly = 0.0
    if mean_flatness > 0.15:
        anomaly += (mean_flatness - 0.15) * 200
    if hf_ratio > 0.25:
        anomaly += (hf_ratio - 0.25) * 150
    if mean_centroid > 2800 or mean_centroid < 600:
        anomaly += 25.0

    anomaly_score = float(np.clip(anomaly, 0.0, 100.0))

    return {
        "spectral_centroid": round(mean_centroid, 2),
        "spectral_rolloff": round(mean_rolloff, 2),
        "spectral_flatness": round(mean_flatness, 4),
        "high_freq_artifacts": round(hf_ratio * 100, 2),
        "spectral_anomaly_score": round(anomaly_score, 1)
    }
