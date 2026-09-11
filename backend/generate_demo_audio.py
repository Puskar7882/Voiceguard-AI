import wave
import numpy as np
import os

def generate_samples():
    os.makedirs("backend/demo_audio", exist_ok=True)
    sr = 16000
    duration = 3.0 # 3 seconds
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)

    # 1. Genuine Human Voice: Natural formants (F0=130Hz, F1=700Hz, F2=1200Hz) with natural micro-vibrato
    vibrato = 1.0 + 0.03 * np.sin(2 * np.pi * 5 * t)
    f0 = 130.0 * vibrato
    phase0 = 2 * np.pi * np.cumsum(f0) / sr
    genuine_signal = (
        0.5 * np.sin(phase0) +
        0.3 * np.sin(2 * phase0) +
        0.15 * np.sin(3 * phase0) +
        0.05 * np.sin(4 * phase0)
    )
    # Smooth envelope
    env = np.sin(np.pi * t / duration) ** 0.5
    genuine_samples = (genuine_signal * env * 25000).astype(np.int16)

    with wave.open("backend/demo_audio/sample_genuine_human.wav", "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(genuine_samples.tobytes())

    # 2. AI Cloned / Deepfake Voice: Rigid monotone pitch (185Hz) with metallic neural vocoder harmonic artifacts
    f_clone = 185.0
    phase_clone = 2 * np.pi * f_clone * t
    # Add synthetic square/saw buzz and high frequency vocoder cutoff
    clone_signal = (
        0.4 * np.sin(phase_clone) +
        0.3 * np.sign(np.sin(2 * phase_clone)) +
        0.2 * np.sin(5 * phase_clone) +
        0.15 * np.sin(11 * phase_clone)
    )
    clone_samples = (clone_signal * 24000).astype(np.int16)

    with wave.open("backend/demo_audio/sample_ai_cloned_spoof.wav", "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(clone_samples.tobytes())

    # 3. Borderline Voice: Degraded telephone bandpass / compressed audio
    f_border = 160.0
    border_signal = (
        0.45 * np.sin(2 * np.pi * f_border * t) +
        0.25 * np.sin(2 * np.pi * 2 * f_border * t) +
        0.15 * np.random.randn(len(t))
    )
    border_samples = (border_signal * env * 22000).astype(np.int16)

    with wave.open("backend/demo_audio/sample_borderline_noisy.wav", "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(border_samples.tobytes())

    print("Demo audio samples generated successfully in backend/demo_audio/")

if __name__ == "__main__":
    generate_samples()
