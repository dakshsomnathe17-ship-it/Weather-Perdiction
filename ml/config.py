import os
from dataclasses import dataclass, field

@dataclass
class Config:
    """Configuration for weather prediction ML pipeline."""
    DATA_DIR: str = os.path.join(os.path.dirname(__file__), 'data', 'era5')
    MODEL_DIR: str = os.path.join(os.path.dirname(__file__), 'saved_models', 'era5_24h')
    OPEN_METEO_ARCHIVE_URL: str = "https://archive-api.open-meteo.com/v1/archive"
    OPEN_METEO_FORECAST_URL: str = "https://api.open-meteo.com/v1/forecast"
    
    DEFAULT_FEATURES: list[str] = field(default_factory=lambda: [
        'latitude', 'longitude', 'temperature_2m', 'relative_humidity_2m',
        'pressure_msl', 'wind_speed_10m', 'cloud_cover', 'precipitation'
    ])
    
    TARGET_COLUMNS: list[str] = field(default_factory=lambda: [
        'temperature', 'humidity', 'pressure', 'wind_speed', 
        'cloud_cover', 'precipitation_24h'
    ])
    
    TRAIN_TEST_SPLIT: float = 0.2
    RANDOM_STATE: int = 42
    CV_FOLDS: int = 5

config = Config()
