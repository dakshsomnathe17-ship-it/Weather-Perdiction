from typing import List, Dict, Any
from app.providers.factory import ProviderFactory
from app.services.cache_service import cache_service

class WeatherService:
    def __init__(self):
        self.provider = ProviderFactory.create_provider()

    async def get_current_weather(self, lat: float, lon: float) -> dict:
        cache_key = f"current_{lat}_{lon}"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached
            
        data = await self.provider.get_current(lat, lon)
        await cache_service.set(cache_key, data, ttl=600)
        return data

    async def get_forecast(self, lat: float, lon: float, days: int = 7) -> List[dict]:
        cache_key = f"forecast_{lat}_{lon}_{days}"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached
            
        data = await self.provider.get_forecast(lat, lon, days)
        await cache_service.set(cache_key, data, ttl=1800)
        return data

    async def get_historical(self, lat: float, lon: float, start_date: str, end_date: str) -> List[dict]:
        cache_key = f"history_{lat}_{lon}_{start_date}_{end_date}"
        cached = await cache_service.get(cache_key)
        if cached:
            return cached
            
        data = await self.provider.get_historical(lat, lon, start_date, end_date)
        await cache_service.set(cache_key, data, ttl=86400)
        return data

    async def search_locations(self, query: str) -> List[dict]:
        return await self.provider.search_location(query)

weather_service = WeatherService()
