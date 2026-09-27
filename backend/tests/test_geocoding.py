import asyncio
import time
import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.services.geocoding_service import GeocodingService, SearchUnavailable
from app.routers.weather import router

PUNE = {"place_id": 123, "name": "Pune", "display_name": "Pune, Maharashtra, India", "lat": "18.5204", "lon": "73.8567", "boundingbox": ["18.41", "18.65", "73.72", "74.02"], "address": {"country": "India", "state": "Maharashtra"}}

def test_normalization_preserves_bounds_and_filters_invalid_points():
    rows = GeocodingService.normalize([PUNE, {**PUNE, "lat": "nan"}, {**PUNE, "lon": "181"}, {}])
    assert len(rows) == 1
    assert rows[0]["lat"] == 18.5204
    assert rows[0]["bounds"] == [18.41, 18.65, 73.72, 74.02]

def test_cache_and_rate_limit_are_shared_between_service_instances(tmp_path):
    starts = []
    def respond(request):
        starts.append(time.monotonic())
        assert "WeatherPrediction" in request.headers["User-Agent"]
        assert request.url.params["format"] == "jsonv2"
        return httpx.Response(200, json=[PUNE])
    transport = httpx.MockTransport(respond)
    async def run():
        a = GeocodingService(cache_path=tmp_path / "cache.db", transport=transport)
        b = GeocodingService(cache_path=tmp_path / "cache.db", transport=transport)
        assert (await a.search(" Pune "))[0]["name"] == "Pune"
        assert (await b.search("pune"))[0]["name"] == "Pune"
        assert len(starts) == 1
        await asyncio.gather(a.search("Mumbai"), b.search("Delhi"))
    asyncio.run(run())
    assert len(starts) == 3
    assert all(b - a >= 1.0 for a, b in zip(starts, starts[1:]))

def test_upstream_backoff_and_empty_cache(tmp_path):
    calls = []
    def respond(request):
        calls.append(request)
        return httpx.Response(429)
    async def run():
        service = GeocodingService(cache_path=tmp_path / "cache.db", transport=httpx.MockTransport(respond))
        for _ in range(2):
            with pytest.raises(SearchUnavailable):
                await service.search("Pune")
        assert len(calls) == 1
        assert await service.search(" ") == []
    asyncio.run(run())

def test_search_route_contract_and_query_validation(monkeypatch):
    from app.routers import weather
    class Stub:
        async def search(self, query):
            if query == "offline":
                raise SearchUnavailable()
            return GeocodingService.normalize([PUNE])
    monkeypatch.setattr(weather, "geocoding_service", Stub())
    app = FastAPI(); app.include_router(router, prefix="/api")
    with TestClient(app) as client:
        response = client.get("/api/weather/search?q=Pune")
        assert response.status_code == 200
        assert response.json()[0]["displayName"] == PUNE["display_name"]
        assert client.get("/api/weather/search?q=x").status_code == 422
        response = client.get("/api/weather/search?q=offline")
        assert response.status_code == 503
        assert response.headers["Retry-After"] == "60"
