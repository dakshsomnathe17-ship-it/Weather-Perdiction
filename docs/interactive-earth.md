# Interactive Earth

The dashboard uses React, TypeScript and **CesiumJS** with a WGS84 ellipsoid. Natural Earth shows the global overview. Below 1,200 km camera altitude, OpenStreetMap supplies labeled streets and places automatically. Neither needs a key. Satellite imagery and Esri reference labels remain disabled until you configure Esri.

The Earth overview fills the viewport with a clean space background, camera-relative illumination, a subtle atmospheric rim and stronger map contrast. Full screen keeps the weather-layer controls and selected-area weather card available. The selected location appears in the coordinate HUD and weather panel without a blue marker on the globe; yellow A/B markers appear only while measuring.

No Cesium ion services or assets are requested. The optional engine logo is removed using the public `CreditDisplay.cesiumCredit` API, while Natural Earth/Esri attribution and bundled software licenses remain intact. See [Cesium's guidance for applications without ion](https://community.cesium.com/t/cesium-ion-logo-removal/8979/7). If ion services are added in future, retain their required attribution.

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

## Street and place detail

Street map detail is enabled by default. Zoom toward a city or search for a place to load OpenStreetMap tiles with city names, roads, neighborhoods and mapped points of interest. More detail loads up to tile level 19 as you zoom closer. This is a labeled street map, not satellite photography. Natural Earth remains underneath and returns at overview altitude. Enabled Esri satellite imagery takes precedence. The Street map detail button can disable the automatic layer or retry after an error. The Canvas fallback remains a global map with limited detail.

The default service is `https://tile.openstreetmap.org/`. Only visible-area tiles are requested; there is no offline download, bulk fetch or service-worker prefetch. The browser preserves HTTP caching, its own User-Agent and the normal Referer header. Keep the visible © OpenStreetMap attribution. For deployments beyond light interactive usage, set `VITE_STREET_MAP_URL` to your own/licensed OSM-compatible PNG tile host (base URL, before `{z}/{x}/{y}.png`) and set `VITE_STREET_MAP_CREDIT` to all provider-required attribution HTML. Rebuild after changing these settings. Public tile service availability is best-effort; review the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/) before deployment. Automated browser tests intercept every tile request and never exercise the public service.

## Controls and search

- Drag to rotate; scroll or pinch to zoom.
- Click/tap the surface to select coordinates and request weather. Dragging and multi-touch gestures do not count as selection.
- Double-click/double-tap or use Focus selected location to animate toward the point.
- Search for a city, landmark or address, then press Enter or Search. A unique result automatically moves the camera and requests current weather and the forecast. For multiple matches, choose the correct result. Editing a query cancels its pending automatic selection. The result's bounding box and viewport aspect determine camera altitude. Pune starts near 18.5204 N, 73.8567 E (live geocoder coordinates can differ).
- Measure distance, then select A and B. The connector and distance follow the WGS84 ellipsoid; a third selection starts over. Measurement does not change the selected weather location.
- Zoom, reset and measurement controls are keyboard-accessible. Focus the globe for arrow keys, +/-, and R.
- Full screen expands the Earth and layer controls; use Exit full screen or Escape to return. Earth overview (R) fits the globe to the current viewport. Browsers without full-screen support omit that button.
- Reduced-motion preferences shorten flights. Cesium renders on demand and pauses when hidden/offscreen.

Natural Earth is a low-resolution global physical map; the online street layer supplies close-up detail. There is no elevation terrain, Street View or photorealistic building layer. Esri must be configured for detailed satellite photography.

## Canvas fallback

If WebGL creation fails, rendering fails, or the context is lost, a custom HTML Canvas renderer displays a locally bundled Natural Earth image. It supports rotation, limited zoom, selection, search focus, measurements, A/B markers and weather points. It uses an orthographic geographic projection (a spherical visual approximation); the distance calculation remains ellipsoidal WGS84. It does not load satellite detail or reference tiles. Rendering uses a capped backing resolution and runs only when something changes.

The fallback JPEG is stitched from Cesium's bundled NaturalEarthII tiles. Regenerate it without downloading new imagery:

```sh
cd frontend
npm run textures:prepare
```

## Search service

/api/weather/search?q=Pune uses Nominatim through the backend. Search occurs on explicit submission, never autocomplete. Responses are cached for 24 hours. A shared SQLite gate spaces upstream requests by at least 1.1 seconds across workers using the same file. Errors propagate as a retryable 503; upstream 429/503 triggers a 60-second cooldown. The UI credits OpenStreetMap.

Configure NOMINATIM_BASE_URL, NOMINATIM_USER_AGENT and NOMINATIM_CACHE_PATH in backend/.env. Use an identifying application/contact user agent. Keep all local workers on the same durable cache file. For multiple hosts or high traffic, use a centrally rate-limited proxy or your own/contracted Nominatim service. Review the [public Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) before deploying at scale. Do not submit confidential addresses or personal information to the public service.

## Weather integration

Existing dashboard queries remain keyed by latitude/longitude. Selection clears previous weather; obsolete requests are cancelled. The selected area's name, temperature, conditions and today's forecast high/low appear on the globe as well as in the full weather panel. The compact card remains available in full screen. Zero coordinates are valid. Missing metrics display Not reported.

The backend expires cached current conditions after 10 minutes and forecasts after 30 minutes. Open-Meteo requests allow up to 15 seconds for response activity (5 seconds to connect). Provider HTTP/network failures return a retryable 503 rather than an unhandled server error.

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
.venv/Scripts/python -m pytest tests/test_geocoding.py tests/test_weather_delivery.py -q
```

The build includes TypeScript checks and copies Cesium Workers/Assets/Widgets/ThirdParty into dist/cesium. Serve dist from the domain root and proxy /api to the backend in production. The preview command serves static assets only. The separate Esri test starts a server on port 4174 with a fixture token and intercepts every Esri request; it verifies authentication parameters, tile loading, layer removal and error recovery without using an account or making paid requests.

Tests cover reference geodesic distances, poles/antipodes, projection round trips, camera framing, real Cesium WebGL rendering, picking after rotation, submitted search, weather overlays, touch/resizing, Canvas fallback and context loss. Browser tests mock weather/search responses; backend tests verify normalization, shared caching/rate limiting and API errors. Browser screenshots are saved under frontend/test-results (ignored). Cesium is lazy-loaded; Vite reports a large Cesium chunk warning, which does not prevent a successful build.
