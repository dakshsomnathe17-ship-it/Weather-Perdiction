from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.database import Base

class MLModelRecord(Base):
    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    version = Column(String)
    model_type = Column(String)
    metrics = Column(JSON, default=dict)
    parameters = Column(JSON, default=dict)
    file_path = Column(String)
    is_active = Column(Boolean, default=False)
    trained_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
