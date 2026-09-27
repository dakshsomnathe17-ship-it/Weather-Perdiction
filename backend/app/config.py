from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./weather.db"
    REDIS_URL: str = "redis://localhost:6379"
    WEATHER_PROVIDER: str = "open_meteo"
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    WEATHERAPI_KEY: str = ""
    ML_MODEL_DIR: str = "./ml_models"
    LLM_PROVIDER: str = "rule_based"
    LLM_API_KEY: str = ""
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    NOMINATIM_BASE_URL: str = "https://nominatim.openstreetmap.org"
    NOMINATIM_USER_AGENT: str = "WeatherPrediction/1.0 (https://github.com/dakshsomnathe17-ship-it/Weather-Perdiction)"
    NOMINATIM_CACHE_PATH: str = "./nominatim-cache.sqlite3"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
