from app.providers.base import WeatherProvider
from app.providers.open_meteo import OpenMeteoProvider
from app.config import settings

class ProviderFactory:
    @staticmethod
    def create_provider(provider_name: str = None) -> WeatherProvider:
        name = provider_name or settings.WEATHER_PROVIDER
        if name == "open_meteo":
            return OpenMeteoProvider()
        return OpenMeteoProvider()
