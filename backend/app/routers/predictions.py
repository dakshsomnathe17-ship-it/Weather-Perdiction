from fastapi import APIRouter
from typing import List
from app.schemas.prediction import (
    PredictionRequest, PredictionResponse, ModelTrainRequest,
    ModelTrainResponse, ModelStatusResponse
)
from app.services.prediction_service import prediction_service

router = APIRouter(tags=["Predictions"])

@router.post("/weather/predict", response_model=PredictionResponse)
async def predict_weather(req: PredictionRequest):
    data = await prediction_service.predict(req.lat, req.lon, req.target_date)
    return PredictionResponse(**data)

@router.get("/models/status", response_model=List[ModelStatusResponse])
async def get_model_status():
    data = await prediction_service.get_model_status()
    return [ModelStatusResponse(**item) for item in data]

@router.post("/models/train", response_model=ModelTrainResponse)
async def train_model(req: ModelTrainRequest):
    data = await prediction_service.trigger_training(req.model_type, req.epochs)
    return ModelTrainResponse(**data)
