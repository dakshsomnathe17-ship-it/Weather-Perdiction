import httpx
from typing import List, Dict, Any

class GeocodingService:
    async def search(self, query: str) -> List[Dict[str, Any]]:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {"name": query, "count": 10, "format": "json"}
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            return data.get("results", [])

    async def reverse_geocode(self, lat: float, lon: float) -> Dict[str, Any]:
        # Using open-meteo as stub for reverse geocoding
        # Note: Nominatim is better for proper reverse geocoding
        return {
            "lat": lat,
            "lon": lon,
            "city": "Unknown",
            "country": "Unknown"
        }

geocoding_service = GeocodingService()
