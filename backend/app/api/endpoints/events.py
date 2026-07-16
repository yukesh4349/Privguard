from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Any
import uuid

from app.api import deps
from app.models.user import User
from app.models.event import ThreatEvent
from app.ml.features import FeatureExtractor
from app.ml.ml_models import IsolationForestAnomalyDetector
from app.core.websockets import manager
import asyncio

router = APIRouter()

feature_extractor = FeatureExtractor()
anomaly_detector = IsolationForestAnomalyDetector()

class EventModel(BaseModel):
    event_id: str
    session_id: str
    username: str
    timestamp: str
    event_type: str
    target_system: Optional[str] = None
    target_object: Optional[str] = None
    bytes_transferred: Optional[int] = None
    command_text: Optional[str] = None
    result_status: Optional[str] = None

def _score_event(event: EventModel) -> tuple[float, float, float, float, str, str]:
    features = feature_extractor.extract_features(event)
    anomaly_score = anomaly_detector.predict_score(features)
    
    rule_score = 0.0
    if event.bytes_transferred and event.bytes_transferred > 500000:
        rule_score = 100.0
    elif event.bytes_transferred and event.bytes_transferred > 10000:
        rule_score = 80.0
        
    if event.event_type in ("privilege_grant", "config_change"):
        rule_score = max(rule_score, 70.0)
        
    if event.command_text and any(cmd in event.command_text.lower() for cmd in ["mysqldump", "chmod 777", "net user", "scp", "curl -x post"]):
        if "chmod 777" in event.command_text.lower():
            rule_score = 100.0
        else:
            rule_score = max(rule_score, 80.0)
            
    graph_score = 0.0
    if event.target_system and any(s in event.target_system for s in ["tier0", "dc-master", "secrets-vault", "domain-controller"]):
        if "dc-master" in event.target_system or "tier0" in event.target_system:
            graph_score = 90.0
        else:
            graph_score = 60.0
            
    composite = (0.35 * rule_score) + (0.45 * anomaly_score) + (0.20 * graph_score)
    
    risk_band = "Low"
    action = "allow"
    if composite > 85:
        risk_band = "Critical"
        action = "auto-block-session"
    elif composite > 60:
        risk_band = "High"
        action = "jit-approval-required"
    elif composite > 30:
        risk_band = "Medium"
        action = "step-up-mfa"
    
    return composite, anomaly_score, rule_score, graph_score, risk_band, action

@router.post("/ingest")
def ingest_event(
    event: EventModel,
    db: Session = Depends(deps.get_db),
    auth_subject: Any = Depends(deps.verify_api_key_or_user)
) -> Any:
    composite, anomaly, rule, graph, band, action = _score_event(event)
    
    db_event = ThreatEvent(
        id=event.event_id,
        session_id=event.session_id,
        username=event.username,
        event_type=event.event_type,
        target_system=event.target_system,
        target_object=event.target_object,
        bytes_transferred=event.bytes_transferred,
        command_text=event.command_text,
        result_status=event.result_status,
        composite_risk_score=composite,
        anomaly_score=anomaly,
        rule_score=rule,
        risk_band=band,
        action_taken=action
    )
    
    db.add(db_event)
    
    if band in ["High", "Critical"]:
        user = db.query(User).filter(User.username == event.username).first()
        if user:
            user.is_flagged = True  # type: ignore
    
    db.commit()
    
    # Broadcast event to WebSockets
    ws_event = {
        "event_id": str(db_event.id),
        "timestamp": event.timestamp,
        "user_name": event.username,
        "event_type": event.event_type,
        "target_system": event.target_system,
        "target_object": event.target_object,
        "composite_risk_score": composite,
        "risk_band": band,
        "action_required": action
    }
    
    try:
        loop = asyncio.get_event_loop()
        loop.create_task(manager.broadcast(ws_event))
    except RuntimeError:
        pass
    
    return {
        "event_id": event.event_id,
        "composite_risk_score": composite,
        "risk_band": band,
        "action_required": action,
        "explanation": f"Risk {composite:.1f}/100"
    }

@router.post("/simulate")
def trigger_simulation(
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    # A lightweight mock simulation function since generate_full_simulation was ripped out
    # For now just return ok.
    return {"status": "Simulation triggered (placeholder)"}
