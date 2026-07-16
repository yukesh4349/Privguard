from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.api import deps
from app.models.user import User
from app.models.event import ThreatEvent
from app.core.websockets import manager

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Dict[str, Any]:
    
    total_events = db.query(func.count(ThreatEvent.id)).scalar() or 0
    critical = db.query(func.count(ThreatEvent.id)).filter(ThreatEvent.risk_band == "Critical").scalar() or 0
    high = db.query(func.count(ThreatEvent.id)).filter(ThreatEvent.risk_band == "High").scalar() or 0
    medium = db.query(func.count(ThreatEvent.id)).filter(ThreatEvent.risk_band == "Medium").scalar() or 0
    low = db.query(func.count(ThreatEvent.id)).filter(ThreatEvent.risk_band == "Low").scalar() or 0
    
    avg_risk = db.query(func.avg(ThreatEvent.composite_risk_score)).scalar() or 0.0
    
    return {
        "total_events": total_events,
        "active_threats": critical + high + medium,
        "critical_alerts": critical,
        "avg_risk_score": float(avg_risk),
        "band_counts": {
            "Low": low,
            "Medium": medium,
            "High": high,
            "Critical": critical
        }
    }

@router.get("/alerts")
def get_alerts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    events = db.query(ThreatEvent).order_by(ThreatEvent.timestamp.desc()).limit(100).all()
    
    results = []
    for e in events:
        results.append({
            "event_id": str(e.id),
            "timestamp": e.timestamp.isoformat() if e.timestamp else "",
            "user_name": e.username or "Unknown",
            "department": "Unknown", # You can join with User table here if needed
            "event_type": e.event_type,
            "target_system": e.target_system or "",
            "target_object": e.target_object or "",
            "bytes_transferred": e.bytes_transferred or 0,
            "command_text": e.command_text or "",
            "composite_risk_score": e.composite_risk_score or 0.0,
            "anomaly_score": e.anomaly_score or 0.0,
            "rule_score": e.rule_score or 0.0,
            "risk_band": e.risk_band or "Low",
            "action_required": e.action_taken or "allow",
            "explanation": f"Risk score: {e.composite_risk_score}",
            "scenario": "suspicious" if e.risk_band in ["High", "Critical"] else "normal"
        })
    return results

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

