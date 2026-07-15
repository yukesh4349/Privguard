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
