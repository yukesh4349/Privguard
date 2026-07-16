from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from models import EventModel, RiskScoreResponse, AlertDetail, DashboardStats, SimulationResponse, LoginRequest, LoginResponse
from features import FeatureExtractor
from ml_models import IsolationForestAnomalyDetector
from simulator import generate_full_simulation
from uuid import UUID
from datetime import datetime
import uuid

# User Credentials database
CREDENTIALS_DB = {
    "admin": {"password": "admin123", "name": "Security Admin", "department": "SecOps", "role": "admin"},
    "alice": {"password": "engineering123", "name": "Alice Chen", "department": "Engineering", "role": "user"},
    "bob": {"password": "finance123", "name": "Bob Martinez", "department": "Finance", "role": "user"},
    "carol": {"password": "hr123", "name": "Carol Singh", "department": "HR", "role": "user"},
    "dave": {"password": "admin123", "name": "Dave Wilson", "department": "IT-Admin", "role": "user"},
    "eve": {"password": "compromised123", "name": "Eve Nakamura", "department": "Contractor", "role": "user"}
}

# Session mapping: active session token -> user profile info
SESSION_USER_MAP = {}

def _resolve_user(session_id: str) -> tuple[str, str]:
    """Helper to resolve name and department from session_id or database."""
    if session_id in SESSION_USER_MAP:
        user = SESSION_USER_MAP[session_id]
        return user["name"], user["department"]
    
    # Fallback to check simulator sessions
    for username, info in CREDENTIALS_DB.items():
        if info["role"] == "admin":
            continue
        for idx in range(30):
            sim_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"{username}-session-{idx}")
            if str(sim_uuid) == session_id:
                return info["name"], info["department"]
                
    return "Unknown", "Unknown"


app = FastAPI(
    title="PrivGuard — Insider Threat Detection Platform",
    description="AI-Driven Privileged Access Misuse & Insider Threat Detection Platform",
    version="2.0.0"
)

# CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize singletons
feature_extractor = FeatureExtractor()
anomaly_detector = IsolationForestAnomalyDetector()

# In-memory alert store
alert_store: list[AlertDetail] = []


def _score_event(event: EventModel) -> tuple[float, float, float, float, str, str]:
    """Run the full scoring pipeline on an event. Returns (composite, anomaly, rule, graph, band, action)."""
    # 1. Feature Extraction
    features = feature_extractor.extract_features(event)
    
    # 2. Anomaly Model (UEBA) evaluation
    anomaly_score = anomaly_detector.predict_score(features)
    
    # 3. Rule Engine evaluation
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
        
    # 4. Graph Context evaluation (enhanced mock)
    graph_score = 0.0
    if event.target_system and any(s in event.target_system for s in ["tier0", "dc-master", "secrets-vault", "domain-controller"]):
        if "dc-master" in event.target_system or "tier0" in event.target_system:
            graph_score = 90.0
        else:
            graph_score = 60.0
    
    # 5. Composite Score
    composite = (0.35 * rule_score) + (0.45 * anomaly_score) + (0.20 * graph_score)
    
    # Risk band routing
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



@app.post("/api/v1/events/ingest", response_model=RiskScoreResponse)
async def ingest_event(event: EventModel):
    """
    Ingest a single event, evaluate it against rules, anomaly models, and graph context.
    """
    composite, anomaly_score, rule_score, graph_score, risk_band, action = _score_event(event)
    
    explanation = (f"Risk {composite:.1f}/100 - "
                   f"Anomaly Score: {anomaly_score:.1f}, "
                   f"Rule Score: {rule_score:.1f}. "
                   f"Action assigned based on {risk_band} risk band.")
    
    user_name, department = _resolve_user(str(event.session_id))

    # Store in alert store
    alert_store.append(AlertDetail(
        event_id=str(event.event_id),
        timestamp=event.timestamp.isoformat(),
        user_name=user_name,
        department=department,
        event_type=event.event_type,
        target_system=event.target_system or "N/A",
        target_object=event.target_object or "N/A",
        bytes_transferred=event.bytes_transferred or 0,
        command_text=event.command_text or "",
        composite_risk_score=round(composite, 1),
        anomaly_score=round(anomaly_score, 1),
        rule_score=round(rule_score, 1),
        risk_band=risk_band,
        action_required=action,
        explanation=explanation,
        scenario="live"
    ))

        
    return RiskScoreResponse(
        event_id=event.event_id,
        composite_risk_score=composite,
        risk_band=risk_band,
        action_required=action,
        explanation=explanation
    )


@app.get("/api/v1/alerts", response_model=list[AlertDetail])
async def get_alerts():
    """Return all stored alerts, newest first."""
    return list(reversed(alert_store))


@app.get("/api/v1/stats", response_model=DashboardStats)
async def get_stats():
    """Return aggregate dashboard statistics."""
    if not alert_store:
        return DashboardStats(
            total_events=0,
            active_threats=0,
            critical_alerts=0,
            avg_risk_score=0.0,
            band_counts={"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
        )
    
    band_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    total_score = 0.0
    
    for alert in alert_store:
        band_counts[alert.risk_band] = band_counts.get(alert.risk_band, 0) + 1
        total_score += alert.composite_risk_score
    
    return DashboardStats(
        total_events=len(alert_store),
        active_threats=band_counts["Medium"] + band_counts["High"] + band_counts["Critical"],
        critical_alerts=band_counts["Critical"],
        avg_risk_score=round(total_score / len(alert_store), 1),
        band_counts=band_counts
    )


@app.post("/api/v1/simulate", response_model=SimulationResponse)
async def run_simulation():
    """
    Run a full threat simulation: generates normal, suspicious, and malicious events,
    scores them through the ML pipeline, and returns the results.
    """
    # Clear previous simulation data
    alert_store.clear()
    
    raw_events = generate_full_simulation()
    alerts = []
    
    for raw in raw_events:
        meta = raw.pop("_meta", {})
        event = EventModel(**raw)
        
        composite, anomaly_score, rule_score, graph_score, risk_band, action = _score_event(event)
        
        explanation = (f"Risk {composite:.1f}/100 - "
                       f"Anomaly: {anomaly_score:.1f}, "
                       f"Rules: {rule_score:.1f}, "
                       f"Graph: {graph_score:.1f}. "
                       f"→ {action}")
        
        alert = AlertDetail(
            event_id=str(event.event_id),
            timestamp=event.timestamp.isoformat(),
            user_name=meta.get("user_name", "Unknown"),
            department=meta.get("department", "Unknown"),
            event_type=event.event_type,
            target_system=event.target_system or "N/A",
            target_object=event.target_object or "N/A",
            bytes_transferred=event.bytes_transferred or 0,
            command_text=event.command_text or "",
            composite_risk_score=round(composite, 1),
            anomaly_score=round(anomaly_score, 1),
            rule_score=round(rule_score, 1),
            risk_band=risk_band,
            action_required=action,
            explanation=explanation,
            scenario=meta.get("scenario", "unknown")
        )
        
        alerts.append(alert)
        alert_store.append(alert)
    
    threats = sum(1 for a in alerts if a.risk_band in ("Medium", "High", "Critical"))
    
    return SimulationResponse(
        status="simulation_complete",
        events_generated=len(alerts),
        threats_detected=threats,
        alerts=alerts
    )


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "PrivGuard Insider Threat Engine is running."}


@app.post("/api/v1/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    username = req.username.lower().strip()
    if username not in CREDENTIALS_DB or CREDENTIALS_DB[username]["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    user_info = CREDENTIALS_DB[username]
    session_id = str(uuid.uuid4())
    SESSION_USER_MAP[session_id] = {
        "name": user_info["name"],
        "department": user_info["department"],
        "role": user_info["role"]
    }
    
    return LoginResponse(
        username=username,
        name=user_info["name"],
        department=user_info["department"],
        role=user_info["role"],
        token=session_id
    )


# Serve frontend — mount AFTER API routes so /api paths take priority
@app.get("/")
async def serve_login():
    return FileResponse("static/login.html")


app.mount("/static", StaticFiles(directory="static"), name="static")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
