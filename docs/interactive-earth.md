# Interactive Earth

The existing React / TypeScript / React Three Fiber components are retained. No Cesium service, NASA API key, or map token is required for the globe.

## Run locally

With Node.js 22 or newer, from the repository root:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. Imagery is checked in under `frontend/public/textures`; the globe works without external imagery requests. Weather and search use the existing FastAPI service on port 8000, through Vite's `/api` proxy. To run that service in a second terminal, after configuring the backend environment described in the development guide:

```sh
python -m pip install -r backend/requirements.txt
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

If the service is unavailable, the globe stays interactive and the dashboard shows a retryable weather error. It does not invent weather for a selected point.

## Interactions

- Drag to orbit; scroll or pinch to zoom. Panning is disabled so Earth stays centered.
- Click or tap to select coordinates and request weather. Drags, cancelled pointers and multi-touch gestures do not select locations.
- Double-click or double-tap to smoothly focus and zoom to the point. Search results and the focus button also move the camera to the selection.
- Toolbar: pause/resume rotation, zoom, reset, focus, clouds and atmosphere.
- Focus the globe with Tab: arrow keys rotate, `+` / `-` zoom, `R` resets, Space toggles rotation and Enter focuses the selection. Shortcuts do not intercept typing in search or other controls.
- Motion is reduced when the operating system requests it. Rendering pauses when the globe is offscreen or the document is hidden; paused views render on demand.

## Coordinates, layers and rendering

`Globe.tsx` rotates one parent group containing Earth, clouds, weather and the marker. OrbitControls only moves the camera. A world-space ray hit is transformed back into Earth-local coordinates before latitude/longitude conversion. Camera flights use quaternion arcs and bounded radii, including flights to the opposite hemisphere.

The day and night maps are sRGB; water and cloud masks are linear. The Earth shader blends diffuse sunlight, warm night lights, water-only specular response and a twilight rim. The separate atmosphere uses additive blending. Grayscale clouds are an alpha mask rather than an opaque shell. Texture effects dispose owned resources and ignore late results after unmount, including React StrictMode remounts. A plain surface and a status message remain when an asset fails; no fabricated continents are substituted.

Weather layers request the existing endpoint:

```http
GET /api/weather/map?layer=temperature&bounds=-180,-90,180,90
```

The rendering contract is `{ "layer": "temperature", "points": [{ "lat": 37.77, "lon": -122.42, "value": 18 }] }`. Coordinates are degrees and values use the units in `frontend/src/utils/weatherMap.ts`: °C, mm, percent, km/h, hPa, UV index or AQI. Malformed points are ignored. Each active layer has its own palette and opacity. Instanced points are initialized after mount, anchored to Earth's shared transform and excluded from picking. Turning all layers off renders none.

**Backend limitation:** the current map endpoint returns an empty array. The UI displays “Awaiting data” until a provider supplies points. The browser tests supply deterministic API fixtures to verify populated layers. This change does not implement a global weather-grid provider or alter ML forecasts.

Dashboard queries are keyed by coordinates and cancelled when obsolete. Zero latitude/longitude is valid. Search normalizes the backend's `lat`/`lon` fields; weather normalizes `description`. Missing metrics display “Not reported”; previous-location data is cleared on selection.

## Imagery and limitations

See [full credits, sources and usage terms](../frontend/public/textures/ATTRIBUTION.md). Day imagery is NASA Blue Marble August 2004, night lights are NASA/NOAA Black Marble 2016 and decorative clouds are a 2002 composite. They are historical images, not live observations. Sun direction and cloud drift are illustrative, not an astronomical clock. The specular mask is a project-derived approximation from the day image, not an official scientific water mask. Original and bundled SHA-256 checksums are recorded in the texture manifest.

Optional regeneration (requires network access, not needed to run):

```sh
cd frontend
npm run textures:prepare
```

## Validation

```sh
cd frontend
npm run typecheck
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Unit tests cover texture-coordinate alignment, geographic round trips, transformed ray hits, poles, orbit arcs, responsive framing, gesture rejection and map-point validation. Browser tests use real WebGL rendering with software Chromium and mock only weather responses; they cover desktop/touch selection, drag suppression, search, overlays, responsive layout and failure states. Browser screenshots are written under the ignored `frontend/test-results` directory. Actual GPU performance and live weather-provider availability depend on the deployment environment. Vite still warns about the existing large application/3D chunks; the build succeeds.
