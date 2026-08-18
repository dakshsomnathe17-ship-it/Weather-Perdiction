from abc import ABC, abstractmethod
from typing import List, Dict

class WeatherProvider(ABC):
    @abstractmethod
    async def get_current(self, lat: float, lon: float) -> dict:
        pass

    @abstractmethod
    async def get_forecast(self, lat: float, lon: float, days: int = 7) -> List[dict]:
        pass

    @abstractmethod
    async def get_historical(self, lat: float, lon: float, start_date: str, end_date: str) -> List[dict]:
        pass

    @abstractmethod
    async def search_location(self, query: str) -> List[dict]:
        pass
