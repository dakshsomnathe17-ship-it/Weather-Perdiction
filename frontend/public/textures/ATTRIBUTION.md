# Earth imagery credits and use

These files are bundled locally; no third-party CDN or Google Earth assets are used.
Sources and NASA usage guidance were checked on 2026-09-25. Keep this notice with the images.

| File | Source and credit | Processing |
| --- | --- | --- |
| earth_day.jpg | NASA Earth Observatory, Blue Marble: Next Generation, August 2004. Produced by Reto Stöckli (NASA Goddard Space Flight Center). [Dataset and credits](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/), [base maps](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/). | Resized to 4096 × 2048, JPEG quality 90. |
| earth_night.jpg | NASA Earth Observatory, Black Marble 2016 grayscale. NASA/NOAA Suomi NPP VIIRS observations; Black Marble team. [Dataset downloads](https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/). | Resized to 2048 × 1024, JPEG quality 90; warm tint applied by the rendering shader. |
| earth_clouds.jpg | NASA Goddard Space Flight Center, Blue Marble: Clouds (2002). Image by Reto Stöckli; enhancements by Robert Simmon; MODIS teams. [Original catalog entry](https://www.visibleearth.nasa.gov/images/57747/blue-marble-clouds?size=medium), [NASA GSFC credits](https://science.gsfc.nasa.gov/690/Earth.html). | 2048 × 1024 grayscale image used as an opacity mask, JPEG quality 90. Decorative historical composite, not live cloud cover. |
| earth_water.jpg | Derived by this project from earth_day.jpg. | Approximate blue-water classification, slightly blurred; linear specular mask. Not a NASA scientific land/water product. |

Exact source URLs, source checksums and output checksums are in [manifest.json](manifest.json).
Recreate the derivatives from the repository's frontend directory with `npm run textures:prepare`.
The checked-in assets are sufficient to run the app without downloading imagery again.

NASA imagery generally is not subject to US copyright and may be used for informational and educational purposes, subject to its [Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). Credit NASA and the named creators. No NASA endorsement is implied. NASA logos and third-party copyrighted material are not covered by this general permission. These image credits and usage terms are separate from the project's software license.

The surface and lights are historical composites from different years. Cloud movement, lighting, atmosphere and specular response are illustrative. They do not represent current satellite observations or a real-time astronomical Sun position. Weather overlays use only points returned by the weather API.
