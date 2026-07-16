import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base_class import Base

class ThreatEvent(Base):
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, index=True, nullable=False)
    username = Column(String, index=True, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    event_type = Column(String, nullable=False)
    target_system = Column(String, nullable=True)
    target_object = Column(String, nullable=True)
    bytes_transferred = Column(Integer, nullable=True)
    command_text = Column(String, nullable=True)
    result_status = Column(String, nullable=True)
    
    # ML Scoring Results
    composite_risk_score = Column(Float, nullable=True)
    anomaly_score = Column(Float, nullable=True)
    rule_score = Column(Float, nullable=True)
    risk_band = Column(String, nullable=True)
    action_taken = Column(String, nullable=True)
