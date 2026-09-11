import numpy as np
from scipy.signal import find_peaks, correlate
from typing import Dict, Any

def compute_prosodic_features(audio_samples: np.ndarray, sample_rate: int = 16000) -> Dict[str, Any]:
    """
    Extracts prosodic / intonation features:
    - Pitch (F0) estimation via autocorrelation
    - Pitch variability (standard deviation of fundamental frequency)
    - Jitter: cycle-to-cycle perturbation of pitch period
    - Shimmer: cycle-to-cycle perturbation of amplitude
    - Pause / Silence ratio: unnatural cadence typical of synthetic TTS generators
    """
    if len(audio_samples) < sample_rate * 0.1: # Less than 100ms
        return {
            "f0_mean_hz": 140.0,
            "f0_std_hz": 20.0,
            "jitter_percent": 0.8,
            "shimmer_percent": 2.5,
            "pause_ratio": 0.1,
            "prosody_unnaturalness_score": 15.0
        }

    # Normalize samples
    samples = audio_samples.astype(np.float32)
    max_val = np.max(np.abs(samples))
    if max_val > 0:
        samples = samples / max_val

    # Windowing for pitch tracking (30ms windows, 15ms step)
    frame_size = int(0.03 * sample_rate)
    hop_size = int(0.015 * sample_rate)
    num_frames = (len(samples) - frame_size) // hop_size

    min_period = int(sample_rate / 400) # 400Hz max pitch
    max_period = int(sample_rate / 60)  # 60Hz min pitch

    f0_estimates = []
    amplitudes = []
    silent_frames = 0

    for i in range(max(1, num_frames)):
        frame = samples[i * hop_size : i * hop_size + frame_size]
        energy = np.sum(frame ** 2)
        if energy < 1e-4:
            silent_frames += 1
            continue

        amplitudes.append(float(np.sqrt(energy / frame_size)))

        # Autocorrelation for pitch period
        corr = correlate(frame, frame, mode='full')
        corr = corr[len(corr)//2 :]
        
        if len(corr) > max_period:
            peak_range = corr[min_period:max_period]
            if len(peak_range) > 0 and np.max(peak_range) > 0.3 * corr[0]:
                peak_idx = np.argmax(peak_range) + min_period
                f0 = sample_rate / peak_idx
                f0_estimates.append(f0)

    # Compute metrics
    f0_mean = float(np.mean(f0_estimates)) if f0_estimates else 140.0
    f0_std = float(np.std(f0_estimates)) if len(f0_estimates) > 2 else 15.0

    # Jitter (relative period differences)
    if len(f0_estimates) > 3:
        periods = [1.0 / f for f in f0_estimates]
        diffs = np.abs(np.diff(periods))
        jitter = float((np.mean(diffs) / np.mean(periods)) * 100.0)
    else:
        jitter = 1.0

    # Shimmer (relative amplitude differences)
    if len(amplitudes) > 3:
        amp_diffs = np.abs(np.diff(amplitudes))
        shimmer = float((np.mean(amp_diffs) / (np.mean(amplitudes) + 1e-6)) * 100.0)
    else:
        shimmer = 2.0

    pause_ratio = float(silent_frames / max(1, num_frames))

    # Synthetic TTS / voice clones frequently show robotic pitch flatness (extremely low f0_std < 4.0 Hz),
    # or hyper-jitter/shimmer concatenation artifacts from neural vocoders
    unnaturalness = 0.0
    if f0_std < 4.0:  # Truly monotone robotic pitch
        unnaturalness += (4.0 - f0_std) * 7.5
    if jitter > 6.0:  # Unnatural vocoder glitch jitter
        unnaturalness += (jitter - 6.0) * 10.0
    if shimmer > 12.0:  # Unnatural amplitude discontinuity
        unnaturalness += (shimmer - 12.0) * 4.5
    if pause_ratio > 0.70:
        unnaturalness += 12.0

    prosody_score = float(np.clip(unnaturalness, 0.0, 100.0))

    return {
        "f0_mean_hz": round(f0_mean, 1),
        "f0_std_hz": round(f0_std, 1),
        "jitter_percent": round(jitter, 2),
        "shimmer_percent": round(shimmer, 2),
        "pause_ratio": round(pause_ratio, 3),
        "prosody_unnaturalness_score": round(prosody_score, 1)
    }
