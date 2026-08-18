from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), index=True)
    temperature = Column(Float)
    feels_like = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    wind_direction = Column(Float, nullable=True)
    cloud_cover = Column(Float, nullable=True)
    visibility = Column(Float, nullable=True)
    uv_index = Column(Float, nullable=True)
    aqi = Column(Integer, nullable=True)
    precipitation = Column(Float, nullable=True)
    snow = Column(Float, nullable=True)
    weather_code = Column(Integer, nullable=True)
    weather_description = Column(String, nullable=True)
    sunrise = Column(DateTime(timezone=True), nullable=True)
    sunset = Column(DateTime(timezone=True), nullable=True)
    is_prediction = Column(Boolean, default=False)
    source = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
