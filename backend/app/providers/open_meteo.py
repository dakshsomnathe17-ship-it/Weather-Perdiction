import httpx
from typing import List, Dict
from app.providers.base import WeatherProvider
from app.config import settings

def get_weather_description(code: int) -> str:
    mapping = {
        0: "Clear sky",
        1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing rime fog",
        51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
        56: "Light freezing drizzle", 57: "Dense freezing drizzle",
        61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        66: "Light freezing rain", 67: "Heavy freezing rain",
        71: "Slight snow fall", 73: "Moderate snow fall", 75: "Heavy snow fall",
        77: "Snow grains",
        80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
        85: "Slight snow showers", 86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
    }
    return mapping.get(code, "Unknown")

class OpenMeteoProvider(WeatherProvider):
    async def get_current(self, lat: float, lon: float) -> dict:
        url = f"{settings.OPEN_METEO_BASE_URL}/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility",
            "timezone": "auto"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            curr = data.get("current", {})
            code = curr.get("weather_code", 0)
            return {
                "temperature": curr.get("temperature_2m"),
                "feels_like": curr.get("apparent_temperature"),
                "humidity": curr.get("relative_humidity_2m"),
                "wind_speed": curr.get("wind_speed_10m"),
                "weather_code": code,
                "description": get_weather_description(code)
            }

    async def get_forecast(self, lat: float, lon: float, days: int = 7) -> List[dict]:
        url = f"{settings.OPEN_METEO_BASE_URL}/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
            "timezone": "auto",
            "forecast_days": days
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            daily = data.get("daily", {})
            times = daily.get("time", [])
            forecasts = []
            for i in range(len(times)):
                code = daily.get("weather_code", [])[i]
                forecasts.append({
                    "date": times[i],
                    "temp_max": daily.get("temperature_2m_max", [])[i],
                    "temp_min": daily.get("temperature_2m_min", [])[i],
                    "precipitation_sum": daily.get("precipitation_sum", [])[i],
                    "weather_code": code,
                    "description": get_weather_description(code)
                })
            return forecasts

    async def get_historical(self, lat: float, lon: float, start_date: str, end_date: str) -> List[dict]:
        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": "temperature_2m,weather_code",
            "timezone": "auto"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            history = []
            for i in range(len(times)):
                code = hourly.get("weather_code", [])[i]
                history.append({
                    "timestamp": times[i],
                    "temperature": hourly.get("temperature_2m", [])[i],
                    "weather_code": code,
                    "description": get_weather_description(code)
                })
            return history

    async def search_location(self, query: str) -> List[dict]:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {
            "name": query,
            "count": 10,
            "language": "en",
            "format": "json"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            results = data.get("results", [])
            locations = []
            for r in results:
                locations.append({
                    "id": r.get("id"),
                    "name": r.get("name"),
                    "country": r.get("country"),
                    "state": r.get("admin1"),
                    "lat": r.get("latitude"),
                    "lon": r.get("longitude")
                })
            return locations
