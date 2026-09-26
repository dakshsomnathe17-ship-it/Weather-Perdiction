import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const directory = new URL('../public/textures/', import.meta.url);
await mkdir(directory, { recursive: true });
const sources = {
  earth_day: 'https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/august/world.200408.3x5400x2700.jpg',
  earth_night: 'https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144897/BlackMarble_2016_01deg_gray.jpg',
  earth_clouds: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg',
};
const manifest = {};
let daySource;
for (const [name, url] of Object.entries(sources)) {
  const response = await fetch(url);
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
    throw new Error(`Image download failed: ${url} (${response.status})`);
  }
  const original = Buffer.from(await response.arrayBuffer());
  if (name === 'earth_day') daySource = original;
  const size = name === 'earth_day' ? 4096 : 2048;
  const output = await sharp(original).resize(size, size / 2).removeAlpha().jpeg({ quality: 90 }).toBuffer();
  await writeFile(new URL(`${name}.jpg`, directory), output);
  manifest[name] = { url, sourceSha256: createHash('sha256').update(original).digest('hex'), sha256: createHash('sha256').update(output).digest('hex'), width: size, height: size / 2 };
}
// A conservative blue-water mask derived from the day image. This is a rendering
// approximation made by this project, not a NASA land/water scientific product.
const { data, info } = await sharp(daySource).resize(2048, 1024).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const mask = Buffer.alloc(info.width * info.height);
for (let i = 0; i < mask.length; i++) {
  const [r, g, b] = data.subarray(i * info.channels, i * info.channels + 3);
  mask[i] = b > r * 1.35 && b > g * 1.05 ? 255 : 0;
}
const water = await sharp(mask, { raw: { width: 2048, height: 1024, channels: 1 } }).blur(0.5).jpeg({ quality: 95 }).toBuffer();
await writeFile(new URL('earth_water.jpg', directory), water);
manifest.earth_water = { derivedFrom: 'earth_day', sha256: createHash('sha256').update(water).digest('hex'), width: 2048, height: 1024 };
await writeFile(new URL('manifest.json', directory), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Prepared four local textures; retain ATTRIBUTION.md when redistributing.');
