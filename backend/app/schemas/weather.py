from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class LocationInfo(BaseModel):
    lat: float
    lon: float
    city: Optional[str] = None
    country: Optional[str] = None

class WeatherCurrent(BaseModel):
    location: LocationInfo
    temperature: float
    feels_like: float
    humidity: float
    wind_speed: float
    weather_code: int
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class WeatherForecastDay(BaseModel):
    date: datetime
    temp_max: float
    temp_min: float
    precipitation_sum: float
    weather_code: int
    description: str

class WeatherForecastResponse(BaseModel):
    location: LocationInfo
    forecast: List[WeatherForecastDay]

class WeatherHistoryRequest(BaseModel):
    lat: float
    lon: float
    start_date: datetime
    end_date: datetime

class WeatherHistoryResponse(BaseModel):
    location: LocationInfo
    history: List[WeatherCurrent]

class WeatherSearchResult(BaseModel):
    id: int
    name: str
    country: str
    state: Optional[str] = None
    lat: float
    lon: float

class WeatherMapData(BaseModel):
    layer: str
    points: List[dict]
