import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const directory = new URL('../public/maps/', import.meta.url);
await mkdir(directory, { recursive: true });
const tiles = [];
for (let x = 0; x < 8; x++) for (let y = 0; y < 4; y++) {
  tiles.push({ input: fileURLToPath(new URL(`../node_modules/cesium/Build/Cesium/Assets/Textures/NaturalEarthII/2/${x}/${y}.jpg`, import.meta.url)), left: x * 256, top: (3 - y) * 256 });
}
const image = await sharp({ create: { width: 2048, height: 1024, channels: 3, background: '#123348' } }).composite(tiles).jpeg({ quality: 90 }).toBuffer();
await writeFile(new URL('natural-earth.jpg', directory), image);
await writeFile(new URL('manifest.json', directory), JSON.stringify({ source: 'CesiumJS Assets/Textures/NaturalEarthII, Natural Earth II by Tom Patterson', sha256: createHash('sha256').update(image).digest('hex'), processing: 'Level 2 TMS tiles stitched to 2048x1024; JPEG quality 90', license: 'Natural Earth public domain' }, null, 2) + '\n');
console.log('Prepared Natural Earth fallback image.');
