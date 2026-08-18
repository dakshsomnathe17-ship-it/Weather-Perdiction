"""Schemas package."""
from app.schemas.weather import (
    WeatherCurrent, WeatherForecastDay, WeatherForecastResponse,
    WeatherHistoryRequest, WeatherHistoryResponse, WeatherSearchResult,
    LocationInfo, WeatherMapData
)
from app.schemas.prediction import (
    PredictionRequest, PredictionResponse, ModelTrainRequest,
    ModelTrainResponse, ModelStatusResponse
)
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistory
