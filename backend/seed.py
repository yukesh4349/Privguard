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

    # Check if we have events, if not create some mock events
    existing_events = db.query(ThreatEvent).count()
    if existing_events == 0:
        event_types = ["Failed Login", "Unauthorized Access", "Data Exfiltration", "Privilege Escalation"]
        target_systems = ["Active Directory", "AWS S3", "Customer Database", "Finance Portal"]
        users = ["alice", "bob", "dave"]
        
        for _ in range(15):
            event = ThreatEvent(
                id=str(uuid.uuid4()),
                session_id=f"SES-{random.randint(10000, 99999)}",
                username=random.choice(users),
                timestamp=datetime.utcnow() - timedelta(minutes=random.randint(1, 1440)),
                event_type=random.choice(event_types),
                target_system=random.choice(target_systems),
                composite_risk_score=random.uniform(30.0, 95.0),
                risk_band=random.choice(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
            )
            db.add(event)
            
        db.commit()
        print("Database seeded with mock events.")

    print("Database seeded successfully with users.")

if __name__ == "__main__":
    seed()
