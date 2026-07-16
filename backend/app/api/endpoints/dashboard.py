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

@router.get("/user-activities/{username}")
def get_user_activities(
    username: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    events = db.query(ThreatEvent).filter(ThreatEvent.username == username).order_by(ThreatEvent.timestamp.desc()).limit(20).all()
    results = []
    for e in events:
        results.append({
            "action": e.event_type,
            "time": e.timestamp.isoformat() if e.timestamp else "",
            "system": e.target_system or "Unknown"
        })
    return results

@router.get("/identity-graph")
def get_identity_graph(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    users = db.query(User).all()
    
    nodes = []
    edges = []
    
    # Base roles/assets
    roles = set()
    for user in users:
        roles.add(user.role.upper() + "_ROLE")
    
    for r in roles:
        nodes.append({
            "id": f"role-{r}",
            "label": r,
            "type": "role",
            "riskScore": 20,
            "status": "active"
        })

    # Assets
    nodes.append({"id": "asset-db-01", "label": "PROD-DB-CLUSTER-01", "type": "server", "riskScore": 90, "status": "active"})
    nodes.append({"id": "asset-dc-01", "label": "CORP-DC-01", "type": "server", "riskScore": 30, "status": "active"})

    for user in users:
        is_compromised = user.is_flagged or user.username == "admin"
        nodes.append({
            "id": f"user-{user.id}",
            "label": f"{user.name} ({user.department})",
            "type": "user",
            "riskScore": 95 if is_compromised else 10,
            "status": "compromised" if is_compromised else "active"
        })
        
        edges.append({
            "id": f"edge-user-{user.id}-role",
            "source": f"user-{user.id}",
            "target": f"role-{user.role.upper()}_ROLE",
            "label": "Assigned To",
            "isHighRiskPath": is_compromised
        })
        
        # Connect roles to assets
        if user.role.lower() == "admin":
            edges.append({
                "id": f"edge-role-{user.role}-db",
                "source": f"role-{user.role.upper()}_ROLE",
                "target": "asset-db-01",
                "label": "Full Root Access",
                "isHighRiskPath": True
            })
        else:
            edges.append({
                "id": f"edge-role-{user.role}-dc",
                "source": f"role-{user.role.upper()}_ROLE",
                "target": "asset-dc-01",
                "label": "Read Only",
                "isHighRiskPath": False
            })

    return {"nodes": nodes, "edges": edges}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

