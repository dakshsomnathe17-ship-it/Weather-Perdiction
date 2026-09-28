import asyncio

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import weather
from app.services import cache_service as cache_module


def test_weather_cache_expires_and_keeps_locations_separate(monkeypatch):
    now = [100.0]
    monkeypatch.setattr(cache_module.time, "monotonic", lambda: now[0])
    cache = cache_module.CacheService()

    async def run():
        await cache.set("current_pune", {"temperature": 21}, ttl=600)
        await cache.set("current_mumbai", {"temperature": 28}, ttl=900)
        assert (await cache.get("current_pune"))["temperature"] == 21
        now[0] = 700.0
        assert await cache.get("current_pune") is None
        assert (await cache.get("current_mumbai"))["temperature"] == 28
        now[0] = 1000.0
        assert await cache.get("current_mumbai") is None

    asyncio.run(run())


@pytest.mark.parametrize("endpoint", ["current", "forecast"])
@pytest.mark.parametrize("failure", ["timeout", "upstream"])
def test_weather_provider_failures_return_retryable_status(monkeypatch, endpoint, failure):
    async def unavailable(*args):
        if failure == "timeout":
            raise httpx.ReadTimeout("upstream timed out")
        response = httpx.Response(429, request=httpx.Request("GET", "https://example.test/weather"))
        response.raise_for_status()

    method = "get_current_weather" if endpoint == "current" else "get_forecast"
    monkeypatch.setattr(weather.weather_service, method, unavailable)
    app = FastAPI()
    app.include_router(weather.router, prefix="/api")
    with TestClient(app) as client:
        response = client.get(f"/api/weather/{endpoint}?lat=19.076&lon=72.8777")
        assert response.status_code == 503
        assert response.headers["Retry-After"] == "15"
        assert "temporarily unavailable" in response.json()["detail"]
