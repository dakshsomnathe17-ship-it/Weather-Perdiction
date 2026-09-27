"""Submitted place searches; shared on-disk caching and a <=1 request/s gate.

All workers on one host must use the same SQLite file. Multiple app hosts must
point NOMINATIM_BASE_URL to a centrally rate-limited/self-hosted service.
"""
import asyncio
import json
import math
import sqlite3
import time
from pathlib import Path

import httpx
from app.config import settings


class SearchUnavailable(Exception):
    pass


class GeocodingService:
    def __init__(self, base_url=None, cache_path=None, transport=None):
        self.base_url = (base_url or settings.NOMINATIM_BASE_URL).rstrip("/")
        self.cache_path = str(cache_path or settings.NOMINATIM_CACHE_PATH)
        self.transport = transport
        self.lock = asyncio.Lock()

    def _db(self):
        Path(self.cache_path).parent.mkdir(parents=True, exist_ok=True)
        db = sqlite3.connect(self.cache_path, timeout=5)
        db.execute("CREATE TABLE IF NOT EXISTS searches (query TEXT PRIMARY KEY, payload TEXT, expires REAL)")
        db.execute("CREATE TABLE IF NOT EXISTS rate_gate (id INTEGER PRIMARY KEY CHECK(id=1), next_start REAL)")
        db.execute("INSERT OR IGNORE INTO rate_gate VALUES (1, 0)")
        db.commit()
        return db

    def _cached_or_claim(self, key):
        db = self._db()
        try:
            db.execute("BEGIN IMMEDIATE")
            now = time.time()
            row = db.execute("SELECT payload FROM searches WHERE query=? AND expires>?", (key, now)).fetchone()
            if row:
                db.commit()
                return json.loads(row[0]), 0
            next_start = db.execute("SELECT next_start FROM rate_gate WHERE id=1").fetchone()[0]
            delay = max(0, next_start - now)
            if delay == 0:
                db.execute("UPDATE rate_gate SET next_start=? WHERE id=1", (now + 1.1,))
            db.commit()
            return None, delay
        finally:
            db.close()

    def _save(self, key, results):
        db = self._db()
        try:
            with db:
                db.execute("DELETE FROM searches WHERE expires<?", (time.time(),))
                db.execute("INSERT OR REPLACE INTO searches VALUES (?, ?, ?)", (key, json.dumps(results), time.time() + 86400))
        finally:
            db.close()

    def _cooldown(self):
        db = self._db()
        try:
            with db:
                db.execute("UPDATE rate_gate SET next_start=MAX(next_start, ?) WHERE id=1", (time.time() + 60,))
        finally:
            db.close()

    @staticmethod
    def normalize(rows):
        results = []
        for row in rows if isinstance(rows, list) else []:
            try:
                lat, lon = float(row["lat"]), float(row["lon"])
                if not math.isfinite(lat) or not math.isfinite(lon) or abs(lat) > 90 or abs(lon) > 180:
                    continue
                address = row.get("address") or {}
                display = str(row.get("display_name") or "")
                bounds = None
                try:
                    box = [float(v) for v in row.get("boundingbox", [])]
                    if len(box) == 4 and all(math.isfinite(v) for v in box) and -90 <= box[0] <= box[1] <= 90 and all(abs(v) <= 180 for v in box[2:]):
                        bounds = box
                except (ValueError, TypeError):
                    pass
                results.append(dict(id=int(row["place_id"]), name=str(row.get("name") or display.split(",")[0] or "Selected place"),
                                    country=str(address.get("country", "")), state=address.get("state"), lat=lat, lon=lon,
                                    bounds=bounds, displayName=display))
            except (ValueError, TypeError, KeyError):
                continue
        return results[:5]

    async def search(self, query):
        query = " ".join(query.split())
        if len(query) < 2 or len(query) > 160:
            return []
        # Scope cached values to endpoint and language so switching providers is safe.
        key = self.base_url + "|en|" + query.casefold()
        try:
            async with self.lock:
                while True:
                    cached, delay = await asyncio.to_thread(self._cached_or_claim, key)
                    if cached is not None:
                        return cached
                    if delay == 0:
                        break
                    if delay > 5:
                        raise SearchUnavailable("Search service cooling down")
                    await asyncio.sleep(delay)
                async with httpx.AsyncClient(timeout=10, transport=self.transport, headers={
                    "User-Agent": settings.NOMINATIM_USER_AGENT,
                    "Accept-Language": "en",
                }) as client:
                    response = await client.get(self.base_url + "/search", params={
                        "q": query, "format": "jsonv2", "addressdetails": 1, "limit": 5,
                    })
                    if response.status_code in (429, 503):
                        await asyncio.to_thread(self._cooldown)
                    response.raise_for_status()
                    results = self.normalize(response.json())
                await asyncio.to_thread(self._save, key, results)
                return results
        except (httpx.HTTPError, ValueError, sqlite3.Error, OSError) as exc:
            raise SearchUnavailable("Place search unavailable") from exc


geocoding_service = GeocodingService()
