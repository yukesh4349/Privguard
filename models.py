from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class EventModel(BaseModel):
    event_id: UUID
    session_id: UUID
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    event_type: str
    target_system: Optional[str] = None
    target_object: Optional[str] = None
    bytes_transferred: Optional[int] = None
    command_text: Optional[str] = None
    result_status: Optional[str] = None

class RiskScoreResponse(BaseModel):
    event_id: UUID
    composite_risk_score: float
    risk_band: str # Low, Medium, High, Critical
    action_required: str
    explanation: str

class AlertModel(BaseModel):
    alert_id: UUID
    entity_id: UUID
    risk_score: float
    severity: str
    status: str

# --- New models for the dashboard ---

class AlertDetail(BaseModel):
    """Full alert detail for the dashboard threat feed."""
    event_id: str
    timestamp: str
    user_name: str
    department: str
    event_type: str
    target_system: str
    target_object: str
    bytes_transferred: int
    command_text: str
    composite_risk_score: float
    anomaly_score: float
    rule_score: float
    risk_band: str
    action_required: str
    explanation: str
    scenario: str  # normal, suspicious, malicious

class DashboardStats(BaseModel):
    """Aggregate statistics for the dashboard header cards."""
    total_events: int
    active_threats: int  # Medium + High + Critical
    critical_alerts: int
    avg_risk_score: float
    band_counts: Dict[str, int]  # {"Low": 10, "Medium": 3, ...}

class SimulationResponse(BaseModel):
    """Response from the simulation endpoint."""
    status: str
    events_generated: int
    threats_detected: int
    alerts: List[AlertDetail]
