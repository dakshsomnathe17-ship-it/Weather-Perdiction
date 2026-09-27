# Interactive Earth

The dashboard uses React, TypeScript and **CesiumJS** with a WGS84 ellipsoid. Natural Earth is the default and requires no account or key. Satellite imagery and reference labels remain disabled until you configure Esri.

## Run locally

With Node.js 22+ and Python 3.12+, in two terminals from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

```sh
cd backend
python -m venv .venv
# Windows PowerShell:
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
# macOS/Linux: use .venv/bin/python instead
```

Open http://localhost:5173. Vite proxies /api to port 8000. Defaults work locally; copy the root .env.example to backend/.env for backend overrides. The globe remains usable without the backend, with explicit weather/search errors. It does not invent weather.

## Optional Esri satellite imagery and labels

Copy frontend/.env.example to frontend/.env.local. Set VITE_ARCGIS_ACCESS_TOKEN to your browser-safe ArcGIS token, restricted to your application's origins and entitled for the services you use. Restart Vite (or rebuild production). Enable Satellite imagery and Place names and borders in the globe toolbar.

The configured World Imagery and World Boundaries and Places MapServer services load tiles as the camera approaches. Provider credits remain visible. Requests are made only after enabling a layer; token/coverage failures leave Natural Earth available with a status message. Optional VITE_ESRI_IMAGERY_URL and VITE_ESRI_LABELS_URL overrides support compatible licensed services. Frontend environment values are public in the built bundle; never put a private server credential here.

See [Cesium's ArcGIS provider documentation](https://cesium.com/learn/cesiumjs/ref-doc/ArcGisMapServerImageryProvider.html) and [map attribution](../frontend/public/maps/ATTRIBUTION.md). This implementation has not been validated with a paid/live Esri token.

## Controls and search

- Drag to rotate; scroll or pinch to zoom.
- Click/tap the surface to select coordinates and request weather. Dragging and multi-touch gestures do not count as selection.
- Double-click/double-tap or use Focus selected location to animate toward the point.
- Search for a city, landmark or address, then press Enter or Search. Selecting a result moves the camera and marker; its bounding box and viewport aspect determine altitude. Pune starts near 18.5204 N, 73.8567 E (live geocoder coordinates can differ).
- Measure distance, then select A and B. The connector and distance follow the WGS84 ellipsoid; a third selection starts over. Measurement does not change the selected weather location.
- Zoom, reset and measurement controls are keyboard-accessible. Focus the globe for arrow keys, +/-, and R.
- Reduced-motion preferences shorten flights. Cesium renders on demand and pauses when hidden/offscreen.

Natural Earth is a low-resolution global physical map: zooming closely cannot reveal streets or newer satellite detail. There is no elevation terrain, Street View or photorealistic building layer.

## Canvas fallback

If WebGL creation fails, rendering fails, or the context is lost, a custom HTML Canvas renderer displays a locally bundled Natural Earth image. It supports rotation, limited zoom, selection, search focus, measurements, markers and weather points. It uses an orthographic geographic projection (a spherical visual approximation); the distance calculation remains ellipsoidal WGS84. It does not load satellite detail or reference tiles. Rendering uses a capped backing resolution and runs only when something changes.

The fallback JPEG is stitched from Cesium's bundled NaturalEarthII tiles. Regenerate it without downloading new imagery:

```sh
cd frontend
npm run textures:prepare
```

## Search service

/api/weather/search?q=Pune uses Nominatim through the backend. Search occurs on explicit submission, never autocomplete. Responses are cached for 24 hours. A shared SQLite gate spaces upstream requests by at least 1.1 seconds across workers using the same file. Errors propagate as a retryable 503; upstream 429/503 triggers a 60-second cooldown. The UI credits OpenStreetMap.

Configure NOMINATIM_BASE_URL, NOMINATIM_USER_AGENT and NOMINATIM_CACHE_PATH in backend/.env. Use an identifying application/contact user agent. Keep all local workers on the same durable cache file. For multiple hosts or high traffic, use a centrally rate-limited proxy or your own/contracted Nominatim service. Review the [public Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) before deploying at scale. Do not submit confidential addresses or personal information to the public service.

## Weather integration

Existing dashboard queries remain keyed by latitude/longitude. Selection clears previous weather; obsolete requests are cancelled. Zero coordinates are valid. Missing metrics display Not reported.

Weather layers use /api/weather/map?layer=temperature&bounds=-180,-90,180,90. The contract is:

```json
{ "layer": "temperature", "points": [{ "lat": 18.5204, "lon": 73.8567, "value": 28 }] }
```

Cesium point collections and Canvas points share palettes, visibility and opacity. Picking always intersects the WGS84 surface in Cesium, so overlays and markers cannot skew geographic coordinates.

**Existing backend limitation:** the map endpoint returns no global weather points. The layer controls display Awaiting data until a provider supplies them. Tests use explicit fixtures to verify populated layers; this change does not add a weather-grid provider or trained ML models.

## Validation

```sh
cd frontend
npm run build
npm test
npx playwright install chromium
npm run test:e2e
npm run test:esri
```

```sh
cd backend
.venv/Scripts/python -m pip install pytest
.venv/Scripts/python -m pytest tests/test_geocoding.py -q
```

The build includes TypeScript checks and copies Cesium Workers/Assets/Widgets/ThirdParty into dist/cesium. Serve dist from the domain root and proxy /api to the backend in production. The preview command serves static assets only. The separate Esri test starts a server on port 4174 with a fixture token and intercepts every Esri request; it verifies authentication parameters, tile loading, layer removal and error recovery without using an account or making paid requests.

Tests cover reference geodesic distances, poles/antipodes, projection round trips, camera framing, real Cesium WebGL rendering, picking after rotation, submitted search, weather overlays, touch/resizing, Canvas fallback and context loss. Browser tests mock weather/search responses; backend tests verify normalization, shared caching/rate limiting and API errors. Browser screenshots are saved under frontend/test-results (ignored). Cesium is lazy-loaded; Vite reports a large Cesium chunk warning, which does not prevent a successful build.
