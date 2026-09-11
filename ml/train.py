import os
import io
import json
import time
import logging
import numpy as np
import soundfile as sf
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score
from transformers import Wav2Vec2Model, Wav2Vec2FeatureExtractor
import datasets
from datasets import load_dataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("VoiceGuard-Trainer")

MODEL_WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "app", "models", "model_weights")
os.makedirs(MODEL_WEIGHTS_DIR, exist_ok=True)
os.makedirs(os.path.dirname(__file__), exist_ok=True)

class DeepfakeClassifierHead(nn.Module):
    """
    Lightweight Neural Classifier Head trained on frozen Wav2Vec2 768-dim embeddings.
    """
    def __init__(self, input_dim: int = 768, hidden_dim1: int = 128, hidden_dim2: int = 32):
        super(DeepfakeClassifierHead, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim1),
            nn.BatchNorm1d(hidden_dim1),
            nn.ReLU(),
            nn.Dropout(0.25),
            nn.Linear(hidden_dim1, hidden_dim2),
            nn.BatchNorm1d(hidden_dim2),
            nn.ReLU(),
            nn.Dropout(0.20),
            nn.Linear(hidden_dim2, 1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        with torch.no_grad():
            logits = self.forward(x)
            return torch.sigmoid(logits)


def extract_wav2vec2_embedding(audio_array: np.ndarray, sr: int, feature_extractor, wav2vec_model, device: str = "cpu") -> np.ndarray:
    """Extracts 768-dim mean-pooled embedding from 16kHz audio array."""
    if sr != 16000:
        # Simple linear resample if needed
        duration = len(audio_array) / sr
        target_len = int(duration * 16000)
        audio_array = np.interp(np.linspace(0, len(audio_array), target_len), np.arange(len(audio_array)), audio_array).astype(np.float32)

    # Normalize audio array
    max_val = np.max(np.abs(audio_array))
    if max_val > 1e-6:
        audio_array = audio_array / max_val

    # Truncate or pad to max 5 seconds (80,000 samples)
    max_samples = 80000
    if len(audio_array) > max_samples:
        audio_array = audio_array[:max_samples]
    elif len(audio_array) < 400:
        audio_array = np.pad(audio_array, (0, 400 - len(audio_array)))

    inputs = feature_extractor(audio_array, sampling_rate=16000, return_tensors="pt")
    input_values = inputs.input_values.to(device)

    with torch.no_grad():
        outputs = wav2vec_model(input_values)
        hidden_states = outputs.last_hidden_state  # shape: (1, seq_len, 768)
        embedding = hidden_states.mean(dim=1).squeeze(0).cpu().numpy()

    return embedding


def load_dataset_samples(max_samples_per_class: int = 250):
    """
    Streams and extracts embeddings from Hugging Face audio deepfake datasets.
    Collects genuine (label 0) and synthetic / cloned (label 1) audio.
    """
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device} for feature extraction")

    logger.info("Loading pretrained Wav2Vec2 feature extractor ('facebook/wav2vec2-base')...")
    feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained("facebook/wav2vec2-base")
    wav2vec_model = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base")
    wav2vec_model.to(device)
    wav2vec_model.eval()

    embeddings = []
    labels = []

    # Dataset sources on Hugging Face
    dataset_sources = [
        "garystafford/deepfake-audio-detection",
        "Hemg/Deepfake-Audio-Dataset"
    ]

    genuine_count = 0
    fake_count = 0

    for ds_name in dataset_sources:
        logger.info(f"Streaming from Hugging Face dataset: {ds_name}...")
        try:
            ds = load_dataset(ds_name, split="train", streaming=True)
            ds = ds.cast_column("audio", datasets.Audio(decode=False))

            for item in ds:
                if genuine_count >= max_samples_per_class and fake_count >= max_samples_per_class:
                    break

                raw_label = item.get("label", item.get("is_fake", 0))
                # Normalize label: 0 for genuine/authentic, 1 for synthetic/spoofed
                label = 1 if (raw_label == 1 or raw_label == "fake" or raw_label == "spoof") else 0

                if label == 0 and genuine_count >= max_samples_per_class:
                    continue
                if label == 1 and fake_count >= max_samples_per_class:
                    continue

                audio_info = item.get("audio", {})
                audio_bytes = audio_info.get("bytes")

                if not audio_bytes:
                    continue

                try:
                    audio_data, sr = sf.read(io.BytesIO(audio_bytes))
                    if audio_data.ndim > 1:
                        audio_data = audio_data.mean(axis=1)

                    emb = extract_wav2vec2_embedding(audio_data, sr, feature_extractor, wav2vec_model, device)
                    embeddings.append(emb)
                    labels.append(label)

                    if label == 0:
                        genuine_count += 1
                    else:
                        fake_count += 1

                    if (genuine_count + fake_count) % 50 == 0:
                        logger.info(f"Extracted {genuine_count} genuine, {fake_count} synthetic samples...")
                except Exception as e:
                    continue

        except Exception as e:
            logger.warning(f"Error loading {ds_name}: {e}")

    logger.info(f"Total dataset collected: {len(embeddings)} samples ({genuine_count} genuine, {fake_count} synthetic)")

    if len(embeddings) == 0:
        raise RuntimeError("No audio samples were loaded from Hugging Face Hub.")

    return np.array(embeddings, dtype=np.float32), np.array(labels, dtype=np.int64)


def train_classifier(embeddings: np.ndarray, labels: np.ndarray):
    """
    Splits into train/val/test, trains neural MLP classifier, and evaluates performance.
    """
    logger.info("Splitting dataset into 70% Train, 15% Validation, 15% Test...")
    X_train, X_temp, y_train, y_temp = train_test_split(
        embeddings, labels, test_size=0.30, random_state=42, stratify=labels
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )

    logger.info(f"Train size: {len(X_train)} | Val size: {len(X_val)} | Test size: {len(X_test)}")

    # Convert to PyTorch tensors
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    train_dataset = TensorDataset(torch.tensor(X_train), torch.tensor(y_train, dtype=torch.float32).unsqueeze(1))
    val_dataset = TensorDataset(torch.tensor(X_val), torch.tensor(y_val, dtype=torch.float32).unsqueeze(1))
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

    model = DeepfakeClassifierHead(input_dim=768, hidden_dim1=128, hidden_dim2=32).to(device)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=5)

    num_epochs = 40
    best_val_loss = float("inf")
    best_weights = None

    logger.info(f"Starting training on {device} for {num_epochs} epochs...")
    for epoch in range(1, num_epochs + 1):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            logits = model(batch_x)
            loss = criterion(logits, batch_y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * batch_x.size(0)

        train_loss /= len(train_dataset)

        # Validation phase
        model.eval()
        val_loss = 0.0
        val_preds = []
        val_targets = []
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                logits = model(batch_x)
                loss = criterion(logits, batch_y)
                val_loss += loss.item() * batch_x.size(0)
                probs = torch.sigmoid(logits).cpu().numpy()
                val_preds.extend(probs)
                val_targets.extend(batch_y.cpu().numpy())

        val_loss /= len(val_dataset)
        val_preds_bin = (np.array(val_preds) >= 0.5).astype(int)
        val_acc = accuracy_score(val_targets, val_preds_bin)
        scheduler.step(val_loss)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_weights = {k: v.cpu() for k, v in model.state_dict().items()}

        if epoch % 5 == 0 or epoch == num_epochs:
            logger.info(f"Epoch [{epoch:02d}/{num_epochs:02d}] Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc*100:.2f}%")

    # Load best weights
    model.load_state_dict(best_weights)
    model.eval()

    # Save model weights and metadata
    weights_path = os.path.join(MODEL_WEIGHTS_DIR, "deepfake_classifier.pt")
    torch.save(best_weights, weights_path)
    logger.info(f"Saved trained classifier weights to {weights_path}")

    # Save held-out test data for evaluate.py
    test_data_path = os.path.join(os.path.dirname(__file__), "test_data.npz")
    np.savez_compressed(test_data_path, X_test=X_test, y_test=y_test, X_val=X_val, y_val=y_val)
    logger.info(f"Saved held-out test dataset to {test_data_path}")

    # Save metadata JSON
    metadata_path = os.path.join(MODEL_WEIGHTS_DIR, "classifier_metadata.json")
    metadata = {
        "architecture": "Wav2Vec2-Base + DeepfakeClassifierHead(768->128->32->1)",
        "feature_extractor": "facebook/wav2vec2-base",
        "embedding_dimension": 768,
        "input_sample_rate": 16000,
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "best_val_loss": round(best_val_loss, 4)
    }
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved classifier metadata to {metadata_path}")


if __name__ == "__main__":
    logger.info("=== VoiceGuard AI Deepfake Classifier Training Pipeline ===")
    embeddings, labels = load_dataset_samples(max_samples_per_class=200)
    train_classifier(embeddings, labels)
    logger.info("=== Training Complete ===")
