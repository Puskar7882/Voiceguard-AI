import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

    PROJECT_NAME: str = "VoiceGuard AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Secret Key for JWT & HMAC
    SECRET_KEY: str = os.getenv("SECRET_KEY", "voiceguard_super_secret_production_key_2026_sih104")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database Settings - MySQL 8 InnoDB by default with SQLite fallback
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "voiceguard")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "voiceguard_pass_2026")
    DB_NAME: str = os.getenv("DB_NAME", "voiceguard_db")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"mysql+pymysql://{os.getenv('DB_USER', 'voiceguard')}:{os.getenv('DB_PASSWORD', 'voiceguard_pass_2026')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '3306')}/{os.getenv('DB_NAME', 'voiceguard_db')}"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./voiceguard_dev.db"
    
    # Razorpay Settings
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_voiceguard104")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "voiceguard_rzp_secret_key_sih2026")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "voiceguard_webhook_secret_2026")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Demo & Inference Settings
    INFERENCE_MODEL_TYPE: str = os.getenv("INFERENCE_MODEL_TYPE", "hybrid_rawnet_spectral")
    PRIVACY_DISCARD_RAW_AUDIO: bool = True

settings = Settings()
