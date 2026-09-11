from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlmodel import SQLModel, Field, Column, JSON, String

class User(SQLModel, table=True):
    __tablename__ = "users"
    __table_args__ = {"mysql_engine": "InnoDB"}

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, nullable=False, max_length=255)
    hashed_password: str = Field(nullable=False, max_length=255)
    role: str = Field(default="user", max_length=50) # "admin", "user"
    plan_id: str = Field(default="pro", max_length=50) # "free", "pro", "enterprise"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DetectionLog(SQLModel, table=True):
    __tablename__ = "detection_logs"
    __table_args__ = {"mysql_engine": "InnoDB"}

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    caller_id: str = Field(index=True, max_length=100) # e.g. "INT_44021", "UNK_88291"
    risk_score: float = Field(nullable=False) # 0 to 100
    verdict: str = Field(max_length=50) # "Verified", "Suspicious", "Deepfake"
    vector_status: str = Field(max_length=50) # "Clear", "Investigating", "Threat Detected"
    action_taken: str = Field(max_length=50) # "Allowed", "Flagged", "Terminated"
    
    # Feature scores (Privacy module compliant: only derived vector metrics, no raw audio)
    spectral_anomaly: float = Field(default=0.0) # 0 - 100
    prosody_score: float = Field(default=0.0) # 0 - 100
    cross_session_link: float = Field(default=0.0) # 0 - 100
    features_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)

class Subscription(SQLModel, table=True):
    __tablename__ = "subscriptions"
    __table_args__ = {"mysql_engine": "InnoDB"}

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True, nullable=False)
    plan_name: str = Field(default="Pro Shield", max_length=100)
    status: str = Field(default="active", max_length=50) # "active", "cancelled", "past_due"
    razorpay_subscription_id: Optional[str] = Field(default=None, max_length=255, index=True)
    current_period_end: Optional[datetime] = Field(default=None)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"
    __table_args__ = {"mysql_engine": "InnoDB"}

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True, nullable=False)
    razorpay_payment_id: str = Field(unique=True, index=True, nullable=False, max_length=255)
    razorpay_order_id: Optional[str] = Field(default=None, index=True, max_length=255)
    amount: float = Field(nullable=False) # In INR
    currency: str = Field(default="INR", max_length=10)
    status: str = Field(default="captured", max_length=50) # "created", "captured", "failed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)

class ApiKey(SQLModel, table=True):
    __tablename__ = "api_keys"
    __table_args__ = {"mysql_engine": "InnoDB"}

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True, nullable=False)
    key_hash: str = Field(unique=True, index=True, nullable=False, max_length=255)
    key_prefix: str = Field(max_length=20, nullable=False) # e.g. "vg_live_7a8f"
    name: Optional[str] = Field(default="Default Production Key", max_length=100)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_used_at: Optional[datetime] = Field(default=None)

class PasswordResetToken(SQLModel, table=True):
    """Short-lived tokens for the forgot-password flow.
    
    NOTE: In this hackathon/demo build, reset links are logged to the backend
    console instead of being emailed. For production, replace console logging
    with a real email provider (e.g. SendGrid, AWS SES, Mailgun).
    """
    __tablename__ = "password_reset_tokens"
    __table_args__ = {"mysql_engine": "InnoDB"}

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True, nullable=False)
    token_hash: str = Field(unique=True, index=True, nullable=False, max_length=255)
    expires_at: datetime = Field(nullable=False)
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
