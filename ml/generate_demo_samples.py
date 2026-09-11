"""
VoiceGuard AI - Standalone Synthetic / Cloned Voice Sample Generator
====================================================================
Generates pre-recorded WAV samples of synthetic voice / deepfake dialogue
for SIH live demo presentations (e.g., fraudulent banking wire authorizations,
executive voice cloning, and urgent override requests).

Engines Supported (automatically selected by availability):
1. Coqui TTS (`pip install TTS`) - Full neural voice cloning & vocoder
2. Hugging Face Transformers TTS (`facebook/mms-tts-eng` / `SpeechT5`)
3. gTTS (`pip install gTTS`) - Google Text-to-Speech (online)
4. pyttsx3 (`pip install pyttsx3`) - Local offline speech synthesis engine

All outputs are automatically converted to standard 16kHz Mono 16-bit PCM WAV
to match telephony & VoiceGuard interception model specifications.

Usage:
    python ml/generate_demo_samples.py
    python ml/generate_demo_samples.py --engine coqui
    python ml/generate_demo_samples.py --engine gtts
    python ml/generate_demo_samples.py --engine pyttsx3
"""

import os
import sys
import io
import argparse
import numpy as np
import soundfile as sf

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "demo_samples")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 3 realistic banking/corporate fraud voice scenarios for SIH presentation
DEMO_SCENARIOS = [
    {
        "filename": "demo_clone_ceo_wire_transfer.wav",
        "title": "Scenario 1: Executive Wire Transfer Authorization (High Risk)",
        "text": (
            "Good afternoon. This is Rajesh Verma from executive treasury. "
            "Please authorize the immediate wire transfer of five lakh rupees "
            "to vendor account four four nine one without delay."
        ),
        "notes": "Targeted VIP executive impersonation attempting INR 500,000 wire release."
    },
    {
        "filename": "demo_clone_urgent_auth_bypass.wav",
        "title": "Scenario 2: Urgent Biometric Bypass Command (Threat Detected)",
        "text": (
            "Confirming authorization code nine eight four two. "
            "Bypass the secondary biometric check and release the corporate ledger funds now."
        ),
        "notes": "Robotic urgent cadence attempting to override protocol checks."
    },
    {
        "filename": "demo_clone_credential_reset.wav",
        "title": "Scenario 3: Treasury Portal Credential Takeover (Suspicious)",
        "text": (
            "Hello support desk, this is Vikram Malhotra. I am locked out of the core banking "
            "treasury terminal. Please reset my authentication credentials immediately."
        ),
        "notes": "Social engineering attempt against helpdesk / telephony switch."
    }
]


def resample_to_16k_mono(audio: np.ndarray, orig_sr: int) -> np.ndarray:
    """Ensures audio is 1D (mono), float32, and 16000Hz."""
    if audio.ndim > 1:
        audio = audio.mean(axis=1)

    if orig_sr != 16000:
        duration = len(audio) / orig_sr
        target_len = int(duration * 16000)
        audio = np.interp(
            np.linspace(0, len(audio), target_len),
            np.arange(len(audio)),
            audio
        ).astype(np.float32)

    # Normalize audio level to [-0.85, 0.85]
    max_val = np.max(np.abs(audio))
    if max_val > 1e-6:
        audio = (audio / max_val) * 0.85
    return audio.astype(np.float32)


def generate_with_coqui(text: str, output_path: str) -> bool:
    """Synthesizes voice using Coqui TTS if installed."""
    try:
        from TTS.api import TTS
        print("  [Engine] Initializing Coqui TTS neural model...")
        # Use lightweight multi-speaker or standard English model
        tts = TTS(model_name="tts_models/en/ljspeech/vits", progress_bar=False, gpu=False)
        temp_wav = output_path + ".tmp.wav"
        tts.tts_to_file(text=text, file_path=temp_wav)
        
        data, sr = sf.read(temp_wav)
        data_16k = resample_to_16k_mono(data, sr)
        sf.write(output_path, data_16k, 16000, subtype="PCM_16")
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
        return True
    except ImportError:
        return False
    except Exception as e:
        print(f"  [Coqui Error] {e}")
        return False


def generate_with_transformers(text: str, output_path: str) -> bool:
    """Synthesizes voice using Hugging Face transformers MMS TTS."""
    try:
        import torch
        from transformers import VitsModel, AutoTokenizer
        print("  [Engine] Initializing Hugging Face VITS TTS (facebook/mms-tts-eng)...")
        
        model_id = "facebook/mms-tts-eng"
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        model = VitsModel.from_pretrained(model_id)
        
        inputs = tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            output = model(**inputs).waveform
        
        audio = output.squeeze().cpu().numpy()
        sr = model.config.sampling_rate
        data_16k = resample_to_16k_mono(audio, sr)
        sf.write(output_path, data_16k, 16000, subtype="PCM_16")
        return True
    except Exception as e:
        print(f"  [Transformers TTS Error] {e}")
        return False


def generate_with_gtts(text: str, output_path: str) -> bool:
    """Synthesizes speech using gTTS."""
    try:
        from gtts import gTTS
        print("  [Engine] Generating via gTTS...")
        tts = gTTS(text=text, lang="en", tld="co.in", slow=False)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        data, sr = sf.read(mp3_fp)
        data_16k = resample_to_16k_mono(data, sr)
        sf.write(output_path, data_16k, 16000, subtype="PCM_16")
        return True
    except Exception as e:
        print(f"  [gTTS Error] {e}")
        return False


def generate_with_pyttsx3(text: str, output_path: str) -> bool:
    """Synthesizes speech using local pyttsx3 engine."""
    try:
        import pyttsx3
        print("  [Engine] Generating via pyttsx3 local synthesizer...")
        engine = pyttsx3.init()
        engine.setProperty("rate", 145)  # Slightly deliberate cadence
        temp_wav = output_path + ".tmp.wav"
        engine.save_to_file(text, temp_wav)
        engine.runAndWait()
        
        if os.path.exists(temp_wav):
            data, sr = sf.read(temp_wav)
            data_16k = resample_to_16k_mono(data, sr)
            sf.write(output_path, data_16k, 16000, subtype="PCM_16")
            os.remove(temp_wav)
            return True
        return False
    except Exception as e:
        print(f"  [pyttsx3 Error] {e}")
        return False


def generate_sample(scenario: dict, preferred_engine: str = "auto") -> str:
    """Attempts synthesis using preferred engine with automatic fallbacks."""
    out_path = os.path.join(OUTPUT_DIR, scenario["filename"])
    text = scenario["text"]
    success = False

    if preferred_engine == "coqui":
        success = generate_with_coqui(text, out_path)
    elif preferred_engine == "transformers":
        success = generate_with_transformers(text, out_path)
    elif preferred_engine == "gtts":
        success = generate_with_gtts(text, out_path)
    elif preferred_engine == "pyttsx3":
        success = generate_with_pyttsx3(text, out_path)
    else:
        # Automatic fallback cascade
        for generator, name in [
            (generate_with_coqui, "Coqui TTS"),
            (generate_with_transformers, "Transformers MMS"),
            (generate_with_gtts, "gTTS"),
            (generate_with_pyttsx3, "pyttsx3")
        ]:
            if generator(text, out_path):
                success = True
                break

    if not success:
        raise RuntimeError(f"Could not generate audio for '{scenario['filename']}' with any available TTS engine.")

    return out_path


def main():
    parser = argparse.ArgumentParser(description="Generate demo synthetic voice clips for SIH presentation.")
    parser.add_argument(
        "--engine",
        choices=["auto", "coqui", "transformers", "gtts", "pyttsx3"],
        default="auto",
        help="Preferred TTS synthesis engine (default: auto)"
    )
    args = parser.parse_args()

    print("=" * 72)
    print(" VoiceGuard AI - Demo Voice Clone Generator (SIH Presentation)")
    print("=" * 72)
    print(f"Target Output Directory: {os.path.abspath(OUTPUT_DIR)}")
    print(f"Engine Mode:            {args.engine}\n")

    generated_files = []

    for i, scenario in enumerate(DEMO_SCENARIOS, 1):
        print(f"[{i}/3] Generating: {scenario['title']}")
        print(f"      File:     {scenario['filename']}")
        print(f"      Text:     \"{scenario['text']}\"")
        
        out_file = generate_sample(scenario, preferred_engine=args.engine)
        
        info = sf.info(out_file)
        print(f"      Saved:    {out_file}")
        print(f"      Spec:     {info.samplerate}Hz | {info.channels} Channel(s) | {info.duration:.2f}s | {info.subtype}\n")
        generated_files.append((out_file, info.duration, scenario))

    print("=" * 72)
    print(" [OK] All Demo Cloned Voice Samples Generated Successfully!")
    print("=" * 72)
    print("\nSummary of Generated Files:")
    for filepath, duration, sc in generated_files:
        print(f"  * {os.path.basename(filepath)} ({duration:.2f}s)")
        print(f"    Scenario: {sc['notes']}")
        print(f"    Path:     {filepath}")

    print("\nHow to use in your live SIH pitch:")
    print("  1. In the Web UI (API & Bank Sandbox / Dashboard):")
    print("     Upload any of these WAV files to demonstrate instant real-time")
    print("     neural deepfake interception and automated wire transfer freezing.")
    print("  2. In Terminal Testing:")
    print("     Run: curl -F \"file=@ml/demo_samples/demo_clone_ceo_wire_transfer.wav\" http://localhost:8000/api/analyze")
    print("=" * 72)


if __name__ == "__main__":
    main()
