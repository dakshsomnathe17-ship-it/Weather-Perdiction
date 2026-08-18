from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)
    model_name = Column(String)
    model_version = Column(String)
    predicted_at = Column(DateTime(timezone=True))
    target_date = Column(DateTime(timezone=True))
    temperature = Column(Float, nullable=True)
    rain_probability = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    cloud_cover = Column(Float, nullable=True)
    visibility = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
