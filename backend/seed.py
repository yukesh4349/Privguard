from app.db.session import SessionLocal
from app.models.user import User
from app.models.event import ThreatEvent
from app.core.security import get_password_hash
import uuid
import random
from datetime import datetime, timedelta

def seed():
    db = SessionLocal()
    
    # Define users to seed
    users_data = [
        {"username": "admin", "name": "Security Admin", "department": "SecOps", "role": "admin"},
        {"username": "alice", "name": "Alice Chen", "department": "Engineering", "role": "user"},
        {"username": "bob", "name": "Bob Smith", "department": "IT Operations", "role": "user"},
        {"username": "charlie", "name": "Charlie Davis", "department": "SecOps", "role": "analyst"},
        {"username": "dave", "name": "Dave Evans", "department": "Management", "role": "manager"},
        {"username": "eve", "name": "Eve Foster", "department": "Audit", "role": "auditor"}
    ]

    for u_data in users_data:
        existing = db.query(User).filter(User.username == u_data["username"]).first()
        if not existing:
            user = User(
                username=u_data["username"],
                name=u_data["name"],
                department=u_data["department"],
                role=u_data["role"],
                hashed_password=get_password_hash("123456")
            )
            db.add(user)
    
    db.commit()

    # Force generation of the 18 specific module events
    event_types_18 = [
        "HONEY_FILE_OPENED", "IMPOSSIBLE_TRAVEL", "DLP_USB_BLOCK", "BIOMETRIC_FAIL", 
        "SCREEN_CAPTURE_DETECTED", "VPN_PROXY_DETECTED", "UNAUTHORIZED_DEVICE", "AI_BEHAVIOR_ANOMALY",
        "OUT_OF_HOURS_ACCESS", "MALICIOUS_LINK_BLOCKED", "SENSITIVE_DB_ACCESS", "DLP_EMAIL_FORWARD",
        "RANSOMWARE_SIGNATURE_DETECTED", "GEO_LOCATION_VIOLATION", "PRIVILEGED_CONFIG_CHANGE"
    ]
    target_systems = ["Active Directory", "AWS S3", "Customer Database", "Finance Portal", "Workday", "admin_passwords.txt", "Local USB Port", "Cisco VPN"]
    users = ["alice", "bob", "dave", "admin", "hr", "dev", "finance"]
    
    for _ in range(30):
        event = ThreatEvent(
            id=str(uuid.uuid4()),
            session_id=f"SES-{random.randint(10000, 99999)}",
            username=random.choice(users),
            timestamp=datetime.utcnow() - timedelta(minutes=random.randint(1, 1440)),
            event_type=random.choice(event_types_18),
            target_system=random.choice(target_systems),
            composite_risk_score=random.uniform(70.0, 99.0),
            risk_band=random.choice(["CRITICAL", "HIGH", "MEDIUM"])
        )
        db.add(event)
        
    db.commit()
    print("Database seeded with 18 enterprise module mock events.")

if __name__ == "__main__":
    seed()
