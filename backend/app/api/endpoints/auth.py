from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uuid
import datetime

from app.models.event import ThreatEvent
from app.core.ip_checker import check_ip_details

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User

router = APIRouter()

@router.post("/login")
def login_access_token(
    request: Request,
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not security.verify_password(form_data.password, str(user.hashed_password)):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        user.username, expires_delta=access_token_expires
    )
    
    # Run IP Checking Process
    client_ip = request.client.host if request.client else "127.0.0.1"
    ip_details = check_ip_details(client_ip)
    
    if ip_details["risk_score"] > 30.0:
        # Log a threat event for high risk login
        event = ThreatEvent(
            id=str(uuid.uuid4()),
            session_id=f"SES-{uuid.uuid4().hex[:8]}",
            username=user.username,
            timestamp=datetime.datetime.utcnow(),
            event_type="GEO_LOCATION_VIOLATION" if ip_details["country"] != "United States" else "VPN_PROXY_DETECTED",
            target_system="Authentication Service",
            composite_risk_score=ip_details["risk_score"],
            risk_band="HIGH" if ip_details["risk_score"] > 80.0 else "MEDIUM"
        )
        db.add(event)
        db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "name": user.name,
        "department": user.department,
        "role": user.role,
        "ip_details": ip_details
    }
