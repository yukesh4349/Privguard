import uuid
from sqlalchemy import Column, String, Boolean, Integer, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base

class User(Base):
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, user, etc.
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    is_flagged = Column(Boolean(), default=False)
    failed_login_attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
