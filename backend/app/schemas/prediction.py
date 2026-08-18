from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PredictionRequest(BaseModel):
    lat: float
    lon: float
    target_date: datetime

class PredictionResponse(BaseModel):
    model_name: str
    target_date: datetime
    temperature: float
    rain_probability: float
    confidence: float

class ModelTrainRequest(BaseModel):
    model_type: str
    epochs: int = 10

class ModelTrainResponse(BaseModel):
    status: str
    job_id: str

class ModelStatusResponse(BaseModel):
    name: str
    version: str
    is_active: bool
    metrics: dict
