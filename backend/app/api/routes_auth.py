from fastapi import APIRouter, Depends, HTTPException, status, Header, Security

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from pydantic import BaseModel, EmailStr

from typing import Optional, List, Dict, Any

from sqlmodel import Session, select

from datetime import datetime, timezone, timedelta

import hashlib

import secrets

import logging



from app.db.session import get_db

from app.db.models import User, ApiKey, PasswordResetToken

from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token, generate_api_key, hash_api_key



router = APIRouter(prefix="/auth", tags=["Authentication & API Keys"])

security_bearer = HTTPBearer(auto_error=False)

logger = logging.getLogger("VoiceGuard.Auth")



# -- Reset-token config --

RESET_TOKEN_EXPIRE_MINUTES = 15

# The frontend URL where the user enters a new password

RESET_PASSWORD_FRONTEND_URL = "http://localhost:5173"



class RegisterRequest(BaseModel):

    email: EmailStr

    password: str

    # Role is intentionally omitted # All public signups default to "user".

    # Admin accounts must be created via seed script or direct DB insert.

    plan_id: Optional[str] = "pro"



class LoginRequest(BaseModel):

    email: EmailStr

    password: str



class TokenResponse(BaseModel):

    access_token: str

    token_type: str = "bearer"

    user: Dict[str, Any]



class ForgotPasswordRequest(BaseModel):

    email: EmailStr



class ResetPasswordRequest(BaseModel):

    token: str

    new_password: str



class ApiKeyCreateRequest(BaseModel):

    name: str



class ApiKeyResponse(BaseModel):

    id: int

    name: str

    key_prefix: str

    created_at: datetime

    last_used_at: Optional[datetime]

    is_active: bool

    full_key: Optional[str] = None



def get_current_user_optional(

    auth: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),

    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),

    db: Session = Depends(get_db)

) -> Optional[User]:

    """Resolves user from Bearer JWT or X-API-Key header if provided."""

    if auth and auth.credentials:

        payload = decode_access_token(auth.credentials)

        if payload and "sub" in payload:

            user_id = payload["sub"]

            user = db.get(User, int(user_id)) if user_id.isdigit() else None

            if user:

                return user



    if x_api_key:

        hashed = hash_api_key(x_api_key)

        api_key_record = db.exec(select(ApiKey).where(ApiKey.key_hash == hashed, ApiKey.is_active == True)).first()

        if api_key_record:

            api_key_record.last_used_at = datetime.now(timezone.utc)

            db.add(api_key_record)

            db.commit()

            return db.get(User, api_key_record.user_id)



    return None



def get_current_user(

    user: Optional[User] = Depends(get_current_user_optional)

) -> User:

    if not user:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Invalid or missing authentication credentials (Bearer token or X-API-Key)",

            headers={"WWW-Authenticate": "Bearer"},

        )

    return user



def require_admin(user: User = Depends(get_current_user)) -> User:

    """Dependency that ensures the authenticated user has admin role."""

    if user.role != "admin":

        raise HTTPException(

            status_code=status.HTTP_403_FORBIDDEN,

            detail="Admin access required for this resource."

        )

    return user



@router.post("/register", response_model=TokenResponse)

def register_user(req: RegisterRequest, db: Session = Depends(get_db)):

    existing = db.exec(select(User).where(User.email == req.email)).first()

    if existing:

        raise HTTPException(status_code=400, detail="User with this email already exists.")

    

    # Force role to "agent" for all public signups # admin accounts are

    # created only through seed scripts or direct DB operations.

    new_user = User(

        email=req.email,

        hashed_password=get_password_hash(req.password),

        role="user",

        plan_id=req.plan_id or "pro",

        created_at=datetime.now(timezone.utc)

    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)



    # Generate initial default API key

    full_k, prefix, k_hash = generate_api_key()

    api_k = ApiKey(

        user_id=new_user.id,

        key_hash=k_hash,

        key_prefix=prefix,

        name="Default Integration Key",

        created_at=datetime.now(timezone.utc)

    )

    db.add(api_k)

    db.commit()



    token = create_access_token(subject=str(new_user.id))

    return {

        "access_token": token,

        "token_type": "bearer",

        "user": {

            "id": new_user.id,

            "email": new_user.email,

            "role": new_user.role,

            "plan_id": new_user.plan_id

        }

    }



@router.post("/login", response_model=TokenResponse)

def login_user(req: LoginRequest, db: Session = Depends(get_db)):

    user = db.exec(select(User).where(User.email == req.email)).first()

    if not user or not verify_password(req.password, user.hashed_password):

        raise HTTPException(status_code=400, detail="Invalid email or password.")

    

    token = create_access_token(subject=str(user.id))

    return {

        "access_token": token,

        "token_type": "bearer",

        "user": {

            "id": user.id,

            "email": user.email,

            "role": user.role,

            "plan_id": user.plan_id

        }

    }



@router.get("/me")

def get_current_user_profile(user: User = Depends(get_current_user)):

    return {

        "id": user.id,

        "email": user.email,

        "role": user.role,

        "plan_id": user.plan_id,

        "created_at": user.created_at

    }



# -- Forgot / Reset Password ----------------------------------------------



@router.post("/forgot-password")

def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):

    """Generate a password-reset token and log the reset link to the console.

    

    # TODO: Replace console logging with a real email delivery service

    # (e.g. SendGrid, AWS SES, Mailgun) for production deployment.

    # The current implementation is intentionally mocked for hackathon/demo

    # purposes to avoid requiring an email provider configuration.

    """

    # Always return the same message regardless of whether the email exists,

    # to prevent user-enumeration attacks (standard security practice).

    generic_response = {

        "message": "If an account exists with this email, a reset link has been generated."

    }



    user = db.exec(select(User).where(User.email == req.email)).first()

    if not user:

        return generic_response



    # Generate a cryptographically secure token

    raw_token = secrets.token_urlsafe(48)

    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)



    reset_record = PasswordResetToken(

        user_id=user.id,

        token_hash=token_hash,

        expires_at=expires_at,

        used=False,

    )

    db.add(reset_record)

    db.commit()



    # -- DEV MODE: Log reset link to console instead of sending email --

    reset_link = f"{RESET_PASSWORD_FRONTEND_URL}/?tab=reset-password&token={raw_token}"

    logger.info(

        "\n"

        "+--------------------------------------------------------------+\n"

        "#  [DEV MODE] Password Reset Link                            #\n"

        "#--------------------------------------------------------------#\n"

        f"#  User:  {user.email:<50} #\n"

        f"#  Token expires in {RESET_TOKEN_EXPIRE_MINUTES} minutes{' ' * 37}#\n"

        "#--------------------------------------------------------------#\n"

        f"#  {reset_link}\n"

        "+--------------------------------------------------------------+"

    )



    return generic_response



@router.post("/reset-password")

def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):

    """Validate the reset token and update the user's password."""

    token_hash = hashlib.sha256(req.token.encode()).hexdigest()



    reset_record = db.exec(

        select(PasswordResetToken).where(

            PasswordResetToken.token_hash == token_hash,

            PasswordResetToken.used == False,

        )

    ).first()



    if not reset_record:

        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")



    if reset_record.expires_at < datetime.now(timezone.utc):

        raise HTTPException(status_code=400, detail="This reset token has expired. Please request a new one.")



    # Update user password

    user = db.get(User, reset_record.user_id)

    if not user:

        raise HTTPException(status_code=400, detail="Associated user account not found.")



    user.hashed_password = get_password_hash(req.new_password)

    db.add(user)



    # Mark token as used so it cannot be reused

    reset_record.used = True

    db.add(reset_record)



    db.commit()



    logger.info(f"Password successfully reset for user: {user.email}")

    return {"message": "Password has been reset successfully."}



# -- API Key Management ----------------------------------------------------



@router.get("/api-keys", response_model=List[ApiKeyResponse])

def list_api_keys(user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    keys = db.exec(select(ApiKey).where(ApiKey.user_id == user.id)).all()

    return [

        ApiKeyResponse(

            id=k.id,

            name=k.name or "API Key",

            key_prefix=k.key_prefix,

            created_at=k.created_at,

            last_used_at=k.last_used_at,

            is_active=k.is_active

        )

        for k in keys

    ]



@router.post("/api-keys", response_model=ApiKeyResponse)

def create_new_api_key(req: ApiKeyCreateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    full_key, prefix, key_hash = generate_api_key()

    new_key = ApiKey(

        user_id=user.id,

        key_hash=key_hash,

        key_prefix=prefix,

        name=req.name,

        created_at=datetime.now(timezone.utc)

    )

    db.add(new_key)

    db.commit()

    db.refresh(new_key)



    return ApiKeyResponse(

        id=new_key.id,

        name=new_key.name,

        key_prefix=new_key.key_prefix,

        created_at=new_key.created_at,

        last_used_at=new_key.last_used_at,

        is_active=new_key.is_active,

        full_key=full_key # Showed once on creation

    )



@router.delete("/api-keys/{key_id}")

def revoke_api_key(key_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    key_record = db.exec(select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user.id)).first()

    if not key_record:

        raise HTTPException(status_code=404, detail="API key not found.")

    db.delete(key_record)

    db.commit()

    return {"message": "API key successfully revoked."}

