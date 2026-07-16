from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from models import EventModel, RiskScoreResponse, AlertDetail, DashboardStats, SimulationResponse, LoginRequest, LoginResponse, FlaggedUser
from features import FeatureExtractor
from ml_models import IsolationForestAnomalyDetector
from simulator import generate_full_simulation
from uuid import UUID
from datetime import datetime
import uuid
from pqc_crypto import MLDSASignatureProvider, MLKEMKeyExchangeProvider, hybrid_encrypt_credential, hybrid_decrypt_credential

# User Credentials database
CREDENTIALS_DB = {
    "admin": {"password": "123456", "name": "Security Admin", "department": "SecOps", "role": "admin"},
    "alice": {"password": "123456", "name": "Alice Chen", "department": "Engineering", "role": "user"},
    "bob": {"password": "123456", "name": "Bob Martinez", "department": "Finance", "role": "user"},
    "carol": {"password": "123456", "name": "Carol Singh", "department": "HR", "role": "user"},
    "dave": {"password": "123456", "name": "Dave Wilson", "department": "IT-Admin", "role": "user"},
    "eve": {"password": "123456", "name": "Eve Nakamura", "department": "Contractor", "role": "user"}
}

# --- PQC Credential Initialization ---
kyber_kem = MLKEMKeyExchangeProvider()
dilithium_sig = MLDSASignatureProvider()
kyber_pub, kyber_priv = kyber_kem.generate_keypair()

for username, info in CREDENTIALS_DB.items():
    # Encrypt password with Kyber
    encrypted_pwd = hybrid_encrypt_credential(info["password"], kyber_kem, kyber_pub)
    info["encrypted_password"] = encrypted_pwd
    
    # Sign the credential record with Dilithium
    record_str = f"{username}:{info['role']}:{info['department']}"
    info["signature"] = dilithium_sig.sign(record_str.encode('utf-8'))
    
    # Remove plaintext password for security
    del info["password"]

# Session mapping: active session token -> user profile info
SESSION_USER_MAP = {}

# --- Anomalous Behavior Tracking ---
# Tracks failed login attempts per username
FAILED_LOGIN_TRACKER: dict[str, list[dict]] = {}

# Tracks users flagged as DANGEROUS
# Key: username, Value: dict with flag details
FLAGGED_USERS: dict[str, dict] = {}

# Maps session tokens back to usernames
SESSION_TO_USERNAME: dict[str, str] = {}

DANGER_THRESHOLD_FAILED_LOGINS = 2  # flag after 2 failed attempts


def flag_user(username: str, reason: str):
    """Flag a user as DANGEROUS with a given reason."""
    if username not in CREDENTIALS_DB or CREDENTIALS_DB[username]["role"] == "admin":
        return  # Don't flag admin or unknown users
    
    now = datetime.utcnow().isoformat()
    if username not in FLAGGED_USERS:
        user_info = CREDENTIALS_DB[username]
        FLAGGED_USERS[username] = {
            "username": username,
            "name": user_info["name"],
            "department": user_info["department"],
            "status": "DANGEROUS",
            "failed_login_attempts": 0,
            "anomalous_actions": 0,
            "reasons": [],
            "last_flagged_at": now
        }
    
    entry = FLAGGED_USERS[username]
    entry["status"] = "DANGEROUS"
    entry["last_flagged_at"] = now
    if reason not in entry["reasons"]:
        entry["reasons"].append(reason)

def _resolve_user(session_id: str, username: str = None) -> tuple[str, str]:
    """Helper to resolve name and department from session_id or database."""
    if username and username in CREDENTIALS_DB:
        user_info = CREDENTIALS_DB[username]
        return user_info["name"], user_info["department"]

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
    
    user_name, department = _resolve_user(str(event.session_id), event.username)

    # --- Anomalous behavior tracking ---
    # Resolve username from session token or event payload
    session_str = str(event.session_id)
    acting_username = event.username or SESSION_TO_USERNAME.get(session_str, None)
    
    if acting_username and risk_band in ("High", "Critical"):
        reason = f"Dangerous action: {event.event_type} on {event.target_system or 'unknown'} (Risk: {risk_band}, Score: {composite:.1f})"
        flag_user(acting_username, reason)
        if acting_username in FLAGGED_USERS:
            FLAGGED_USERS[acting_username]["anomalous_actions"] = FLAGGED_USERS[acting_username].get("anomalous_actions", 0) + 1

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
    """Return all stored alerts, oldest first (chronological)."""
    return alert_store


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
    
    # Check if user account has been removed
    if username not in CREDENTIALS_DB:
        # Track failed attempt for unknown user (might be trying random usernames)
        if username not in FAILED_LOGIN_TRACKER:
            FAILED_LOGIN_TRACKER[username] = []
        FAILED_LOGIN_TRACKER[username].append({
            "timestamp": datetime.utcnow().isoformat(),
            "reason": "unknown_username"
        })
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify Dilithium signature to ensure data integrity
    record_str = f"{username}:{CREDENTIALS_DB[username]['role']}:{CREDENTIALS_DB[username]['department']}"
    if not dilithium_sig.verify(record_str.encode('utf-8'), CREDENTIALS_DB[username]["signature"]):
        raise HTTPException(status_code=500, detail="CRITICAL: Credential record signature verification failed! Possible database tampering.")

    # Decrypt password using Kyber decapsulation
    encrypted_payload = CREDENTIALS_DB[username]["encrypted_password"]
    try:
        decrypted_password = hybrid_decrypt_credential(encrypted_payload, kyber_kem, kyber_priv)
    except Exception as e:
        decrypted_password = None
        
    # Check password
    if decrypted_password != req.password:
        # Track failed login attempt
        if username not in FAILED_LOGIN_TRACKER:
            FAILED_LOGIN_TRACKER[username] = []
        FAILED_LOGIN_TRACKER[username].append({
            "timestamp": datetime.utcnow().isoformat(),
            "reason": "wrong_password"
        })
        
        attempt_count = len(FAILED_LOGIN_TRACKER[username])
        
        # Flag user as DANGEROUS after threshold
        if attempt_count >= DANGER_THRESHOLD_FAILED_LOGINS:
            flag_user(username, f"Multiple failed login attempts ({attempt_count} attempts)")
            FLAGGED_USERS[username]["failed_login_attempts"] = attempt_count
        
        raise HTTPException(
            status_code=401,
            detail=f"Invalid username or password (attempt {attempt_count})"
        )
    
    # Check if the user is flagged/removed
    user_info = CREDENTIALS_DB[username]
    session_id = str(uuid.uuid4())
    SESSION_USER_MAP[session_id] = {
        "name": user_info["name"],
        "department": user_info["department"],
        "role": user_info["role"]
    }
    SESSION_TO_USERNAME[session_id] = username
    
    # Clear failed attempts on successful login (but keep flag if already flagged)
    if username in FAILED_LOGIN_TRACKER:
        FAILED_LOGIN_TRACKER[username] = []
    
    return LoginResponse(
        username=username,
        name=user_info["name"],
        department=user_info["department"],
        role=user_info["role"],
        token=session_id
    )


# --- Flagged Users & Admin Endpoints ---

@app.get("/api/v1/flagged-users", response_model=list[FlaggedUser])
async def get_flagged_users():
    """Return all users flagged as DANGEROUS."""
    return [
        FlaggedUser(**data)
        for data in FLAGGED_USERS.values()
        if data["status"] == "DANGEROUS"
    ]


@app.delete("/api/v1/users/{username}")
async def remove_user(username: str):
    """Admin endpoint: permanently remove a user account."""
    username = username.lower().strip()
    if username not in CREDENTIALS_DB:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")
    if CREDENTIALS_DB[username]["role"] == "admin":
        raise HTTPException(status_code=403, detail="Cannot remove admin account")
    
    # Remove from credentials DB
    removed_info = CREDENTIALS_DB.pop(username)
    
    # Remove from flagged users if present
    FLAGGED_USERS.pop(username, None)
    
    # Invalidate all sessions for this user
    sessions_to_remove = [sid for sid, uname in SESSION_TO_USERNAME.items() if uname == username]
    for sid in sessions_to_remove:
        SESSION_TO_USERNAME.pop(sid, None)
        SESSION_USER_MAP.pop(sid, None)
    
    return {
        "status": "removed",
        "username": username,
        "name": removed_info["name"],
        "message": f"User '{username}' has been permanently removed from the system."
    }


@app.post("/api/v1/users/{username}/unflag")
async def unflag_user(username: str):
    """Admin endpoint: clear the DANGEROUS flag from a user."""
    username = username.lower().strip()
    if username not in FLAGGED_USERS:
        raise HTTPException(status_code=404, detail=f"User '{username}' is not flagged")
    
    FLAGGED_USERS[username]["status"] = "SAFE"
    FLAGGED_USERS[username]["reasons"] = []
    FLAGGED_USERS[username]["failed_login_attempts"] = 0
    FLAGGED_USERS[username]["anomalous_actions"] = 0
    
    return {"status": "unflagged", "username": username, "message": f"User '{username}' has been cleared."}


# Serve frontend — mount AFTER API routes so /api paths take priority
@app.get("/")
async def serve_login():
    return FileResponse("static/login.html")


app.mount("/static", StaticFiles(directory="static"), name="static")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
