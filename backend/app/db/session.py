import logging

from typing import Generator

from datetime import datetime, timezone, timedelta

from sqlmodel import SQLModel, create_engine, Session, select

from app.core.config import settings

from app.db.models import User, DetectionLog, Subscription, Transaction, ApiKey, PasswordResetToken

from app.core.security import get_password_hash, generate_api_key



logger = logging.getLogger(__name__)



# Attempt MySQL connection, fallback to SQLite for zero-friction local development if MySQL isn't running

try:

    engine = create_engine(

        settings.DATABASE_URL,

        echo=False,

        pool_pre_ping=True,

        connect_args={"connect_timeout": 3} if "mysql" in settings.DATABASE_URL else {}

    )

    # Test connection

    with engine.connect() as conn:

        logger.info("Connected successfully to MySQL Database.")

except Exception as e:

    logger.warning(f"Could not connect to MySQL ({e}). Using local SQLite database for zero-config demo.")

    engine = create_engine(

        settings.SQLITE_FALLBACK_URL,

        echo=False,

        connect_args={"check_same_thread": False}

    )



def get_db() -> Generator[Session, None, None]:

    with Session(engine) as session:

        yield session



def init_db():

    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:

        # -- Seed Admin account --

        user = session.exec(select(User).where(User.email == "admin@voiceguard.ai")).first()

        if not user:

            user = User(

                email="admin@voiceguard.ai",

                hashed_password=get_password_hash("voiceguard2026"),

                role="admin",

                plan_id="enterprise",

                created_at=datetime.now(timezone.utc)

            )

            session.add(user)

            session.commit()

            session.refresh(user)



            # Add demo API key

            raw_key, prefix, key_hash = generate_api_key()

            demo_api_key = ApiKey(

                user_id=user.id,

                key_hash=key_hash,

                key_prefix=prefix,

                name="Primary Banking Gateway Key",

                created_at=datetime.now(timezone.utc)

            )

            session.add(demo_api_key)



            # Add demo active subscription

            sub = Subscription(

                user_id=user.id,

                plan_name="Enterprise Sentinel",

                status="active",

                razorpay_subscription_id="sub_VG2026_Ent992",

                current_period_end=datetime.now(timezone.utc) + timedelta(days=365)

            )

            session.add(sub)



            # Add demo transaction

            txn = Transaction(

                user_id=user.id,

                razorpay_payment_id="pay_SIH26104_DEMO_01",

                razorpay_order_id="order_VG2026_01",

                amount=49999.00,

                currency="INR",

                status="captured",

                created_at=datetime.now(timezone.utc) - timedelta(days=5)

            )

            session.add(txn)



            # Seed realistic detection logs matching Stitch dashboard specs

            sample_logs = [

                DetectionLog(

                    user_id=user.id,

                    caller_id="UNK_88291",

                    risk_score=12.0,

                    verdict="Verified",

                    vector_status="Clear",

                    action_taken="Allowed",

                    spectral_anomaly=8.5,

                    prosody_score=14.2,

                    cross_session_link=5.0,

                    features_json={"f0_mean": 132.4, "jitter": 0.008, "shimmer": 0.021, "spectral_flatness": 0.045},

                    timestamp=datetime.now(timezone.utc) - timedelta(minutes=42)

                ),

                DetectionLog(

                    user_id=user.id,

                    caller_id="INT_44021",

                    risk_score=94.0,

                    verdict="Deepfake",

                    vector_status="Threat Detected",

                    action_taken="Terminated",

                    spectral_anomaly=92.4,

                    prosody_score=88.1,

                    cross_session_link=85.0,

                    features_json={"f0_mean": 178.2, "jitter": 0.049, "shimmer": 0.112, "spectral_flatness": 0.28},

                    timestamp=datetime.now(timezone.utc) - timedelta(minutes=59)

                ),

                DetectionLog(

                    user_id=user.id,

                    caller_id="EXT_99210",

                    risk_score=45.0,

                    verdict="Suspicious",

                    vector_status="Investigating",

                    action_taken="Flagged",

                    spectral_anomaly=48.2,

                    prosody_score=65.0,

                    cross_session_link=12.0,

                    features_json={"f0_mean": 145.0, "jitter": 0.022, "shimmer": 0.054, "spectral_flatness": 0.098},

                    timestamp=datetime.now(timezone.utc) - timedelta(minutes=91)

                ),

                DetectionLog(

                    user_id=user.id,

                    caller_id="UNK_77342",

                    risk_score=8.0,

                    verdict="Verified",

                    vector_status="Clear",

                    action_taken="Allowed",

                    spectral_anomaly=6.1,

                    prosody_score=9.8,

                    cross_session_link=3.2,

                    features_json={"f0_mean": 128.9, "jitter": 0.006, "shimmer": 0.018, "spectral_flatness": 0.038},

                    timestamp=datetime.now(timezone.utc) - timedelta(minutes=133)

                ),

                DetectionLog(

                    user_id=user.id,

                    caller_id="EXEC_00192",

                    risk_score=88.0,

                    verdict="Deepfake",

                    vector_status="Threat Detected",

                    action_taken="Terminated",

                    spectral_anomaly=91.0,

                    prosody_score=84.5,

                    cross_session_link=72.0,

                    features_json={"f0_mean": 195.4, "jitter": 0.042, "shimmer": 0.098, "spectral_flatness": 0.245},

                    timestamp=datetime.now(timezone.utc) - timedelta(minutes=180)

                )

            ]

            for log in sample_logs:

                session.add(log)



            session.commit()

            logger.info("Admin account and demo data seeded successfully.")



        # -- Seed User demo account --

        agent_user = session.exec(select(User).where(User.email == "user.verma@fictionalbank-demo.in")).first()

        if not agent_user:

            agent_user = User(

                email="user.verma@fictionalbank-demo.in",

                hashed_password=get_password_hash("voiceguard2026"),

                role="user",

                plan_id="pro",

                created_at=datetime.now(timezone.utc)

            )

            session.add(agent_user)

            session.commit()

            session.refresh(agent_user)



            # Add API key for the user

            raw_key, prefix, key_hash = generate_api_key()

            agent_api_key = ApiKey(

                user_id=agent_user.id,

                key_hash=key_hash,

                key_prefix=prefix,

                name="Agent Default Key",

                created_at=datetime.now(timezone.utc)

            )

            session.add(agent_api_key)

            session.commit()

            logger.info("User demo account seeded successfully (user.verma@fictionalbank-demo.in / voiceguard2026).")