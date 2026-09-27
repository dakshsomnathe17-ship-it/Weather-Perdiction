from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from app.schemas.weather import (
    WeatherCurrent, WeatherForecastResponse, WeatherHistoryResponse,
    WeatherSearchResult, WeatherMapData, LocationInfo
)
from app.services.weather_service import weather_service
from app.services.geocoding_service import geocoding_service, SearchUnavailable

router = APIRouter(prefix="/weather", tags=["Weather"])

@router.get("/current", response_model=WeatherCurrent)
async def get_current_weather(lat: float, lon: float):
    data = await weather_service.get_current_weather(lat, lon)
    return WeatherCurrent(
        location=LocationInfo(lat=lat, lon=lon),
        **data
    )

@router.get("/forecast", response_model=WeatherForecastResponse)
async def get_forecast(lat: float, lon: float, days: int = 7):
    data = await weather_service.get_forecast(lat, lon, days)
    return WeatherForecastResponse(
        location=LocationInfo(lat=lat, lon=lon),
        forecast=data
    )

@router.get("/history", response_model=WeatherHistoryResponse)
async def get_history(lat: float, lon: float, start_date: str, end_date: str):
    data = await weather_service.get_historical(lat, lon, start_date, end_date)
    return WeatherHistoryResponse(
        location=LocationInfo(lat=lat, lon=lon),
        history=data
    )

@router.get("/search", response_model=List[WeatherSearchResult])
async def search_location(q: str = Query(min_length=2, max_length=160)):
    try:
        return await geocoding_service.search(q)
    except SearchUnavailable as exc:
        raise HTTPException(status_code=503, detail="Place search is temporarily unavailable. Try again later.", headers={"Retry-After": "60"}) from exc

@router.get("/map", response_model=WeatherMapData)
async def get_map_data(layer: str, bounds: str):
    return WeatherMapData(layer=layer, points=[])
