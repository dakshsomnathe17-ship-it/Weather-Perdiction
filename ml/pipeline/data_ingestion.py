import logging
import httpx
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any
import time

logger = logging.getLogger(__name__)

DEFAULT_CITIES = [
    {'name': 'New York', 'latitude': 40.71, 'longitude': -74.01},
    {'name': 'London', 'latitude': 51.51, 'longitude': -0.13},
    {'name': 'Tokyo', 'latitude': 35.68, 'longitude': 139.69},
    {'name': 'Mumbai', 'latitude': 19.08, 'longitude': 72.88},
    {'name': 'Sydney', 'latitude': -33.87, 'longitude': 151.21},
    {'name': 'Paris', 'latitude': 48.86, 'longitude': 2.35},
    {'name': 'Berlin', 'latitude': 52.52, 'longitude': 13.40},
    {'name': 'São Paulo', 'latitude': -23.55, 'longitude': -46.63},
    {'name': 'Dubai', 'latitude': 25.20, 'longitude': 55.27},
    {'name': 'Singapore', 'latitude': 1.35, 'longitude': 103.82},
]

class DataIngestion:
    """Class for fetching weather data from APIs."""

    def __init__(self, archive_url: str = "https://archive-api.open-meteo.com/v1/archive"):
        self.archive_url = archive_url

    def fetch_historical_data(self, latitude: float, longitude: float, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Fetch historical weather data for a specific location.

        Args:
            latitude: Latitude of the location.
            longitude: Longitude of the location.
            start_date: Start date in YYYY-MM-DD format.
            end_date: End date in YYYY-MM-DD format.

        Returns:
            pd.DataFrame: DataFrame containing hourly weather data with datetime index.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": "temperature_2m,relative_humidity_2m,precipitation,rain,snowfall,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,visibility",
            "timezone": "UTC"
        }
        
        logger.info(f"Fetching data for {latitude}, {longitude} from {start_date} to {end_date}")
        
        try:
            # Using basic retry for rate limits
            for attempt in range(3):
                response = httpx.get(self.archive_url, params=params)
                if response.status_code == 429:
                    logger.warning("Rate limit hit, waiting...")
                    time.sleep(2 ** attempt)
                    continue
                response.raise_for_status()
                break
            
            data = response.json()
            if "hourly" not in data:
                logger.error("API response missing 'hourly' data.")
                return pd.DataFrame()
            
            hourly_data = data["hourly"]
            df = pd.DataFrame(hourly_data)
            df['time'] = pd.to_datetime(df['time'])
            df.set_index('time', inplace=True)
            df['latitude'] = latitude
            df['longitude'] = longitude
            return df
        
        except Exception as e:
            logger.error(f"Error fetching data: {e}")
            return pd.DataFrame()

    def fetch_multiple_cities(self, cities_config: List[Dict[str, Any]], start_date: str, end_date: str) -> pd.DataFrame:
        """
        Fetch historical data for multiple cities and combine into a single DataFrame.

        Args:
            cities_config: List of dictionaries containing 'name', 'latitude', and 'longitude'.
            start_date: Start date.
            end_date: End date.

        Returns:
            pd.DataFrame: Combined DataFrame.
        """
        all_data = []
        for city in cities_config:
            logger.info(f"Processing city: {city['name']}")
            df = self.fetch_historical_data(city['latitude'], city['longitude'], start_date, end_date)
            if not df.empty:
                df['city'] = city['name']
                all_data.append(df)
            # Sleep briefly to be nice to the API
            time.sleep(1)
            
        if all_data:
            return pd.concat(all_data)
        return pd.DataFrame()

    def save_dataset(self, df: pd.DataFrame, filepath: str) -> None:
        """Save DataFrame to CSV."""
        import os
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        df.to_csv(filepath)
        logger.info(f"Dataset saved to {filepath}")

    def load_dataset(self, filepath: str) -> pd.DataFrame:
        """Load DataFrame from CSV."""
        df = pd.read_csv(filepath, parse_dates=['time'])
        df.set_index('time', inplace=True)
        logger.info(f"Dataset loaded from {filepath} with shape {df.shape}")
        return df
