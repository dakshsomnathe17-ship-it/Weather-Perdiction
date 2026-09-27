# Map imagery and software credits

- **Natural Earth II**, by Tom Patterson / Natural Earth. Public domain: https://www.naturalearthdata.com/about/terms-of-use/ . The local globe tiles are distributed with CesiumJS under `Assets/Textures/NaturalEarthII`. The fallback JPEG is stitched from those tiles; its processing and SHA-256 are recorded in `manifest.json`. This imagery is a generalized global physical map, not live satellite photography. It is not described as a NASA asset.
- **CesiumJS**, Apache License 2.0: https://github.com/CesiumGS/cesium/blob/main/LICENSE.md . Cesium's visible credits and provider attribution are retained. Worker and static assets are copied from the installed npm package at build time.
- **GeographicLib geodesic**, MIT/X11: https://github.com/geographiclib/geographiclib-js . Used for WGS84 ellipsoidal surface distances, including antipodal points.
- **Search results: © OpenStreetMap contributors**, ODbL: https://www.openstreetmap.org/copyright . Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/ . Search runs through the backend on explicit submission, with caching and a shared request limit.
- **Optional Esri imagery and reference labels** are online services subject to your ArcGIS account, service entitlements and terms: https://developers.arcgis.com/documentation/mapping-and-location-services/ and https://www.esri.com/en-us/legal/terms/full-master-agreement . No Esri imagery is bundled or redistributed here. The provider displays service-specific credits when enabled. Configure a permitted browser token before use.

No Google imagery, private APIs, Street View, elevation terrain or photorealistic buildings are included.

Full software license copies ship with the app at `/licenses/cesium/LICENSE.md` and `/licenses/geographiclib/LICENSE.txt`.
