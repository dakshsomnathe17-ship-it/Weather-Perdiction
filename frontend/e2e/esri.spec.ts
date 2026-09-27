import { expect, test } from '@playwright/test';
import sharp from 'sharp';

test('optional Esri metadata/tiles carry token, toggle cleanly and recover from failure', async ({ page }) => {
  const requests: URL[] = [];
  let fail = false;
  const transparent = await sharp({ create: { width: 256, height: 256, channels: 4, background: '#00000000' } }).png().toBuffer();
  const tile = await sharp({ create: { width: 256, height: 256, channels: 4, background: '#194963' } }).png().toBuffer();
  // Intercept the entire Esri host: this test never sends the fixture token upstream.
  await page.route('https://ibasemaps-api.arcgis.com/**', async route => {
    const url = new URL(route.request().url()); requests.push(url);
    if (fail) return route.fulfill({ status: 403, json: { error: { code: 403 } } });
    if (url.pathname.includes('/tile/')) return route.fulfill({ contentType: 'image/png', body: url.pathname.endsWith('/tile/5/0/0') ? transparent : tile });
    return route.fulfill({ json: { copyrightText: 'Esri fixture attribution', singleFusedMapCache: true,
      tileInfo: { rows: 256, cols: 256, dpi: 96, format: 'PNG32', origin: { x: -180, y: 90 }, spatialReference: { wkid: 4326 }, lods: Array.from({ length: 6 }, (_, level) => ({ level, resolution: .703125 / 2 ** level, scale: 295829355.45 / 2 ** level })) },
      fullExtent: { xmin: -180, ymin: -90, xmax: 180, ymax: 90, spatialReference: { wkid: 4326 } } } });
  });
  await page.route('**/api/weather/**', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/');
  await expect(page.locator('.cesium-widget canvas')).toBeVisible({ timeout: 30000 });
  const satellite = page.getByRole('button', { name: 'Satellite imagery', exact: true });
  await expect(satellite).toBeEnabled(); expect(requests).toHaveLength(0);
  await satellite.click();
  await expect.poll(() => requests.filter(u => u.pathname.includes('World_Imagery/MapServer/tile/')).length).toBeGreaterThan(0);
  await expect(page.locator('.cesium-widget-credits')).toContainText('Esri fixture attribution');
  const labels = page.getByRole('button', { name: 'Place names and borders' });
  await labels.click();
  await expect.poll(() => requests.filter(u => u.pathname.includes('World_Boundaries_and_Places/MapServer/tile/')).length).toBeGreaterThan(0);
  expect(requests.every(u => u.searchParams.get('token') === 'fixture-token')).toBe(true);
  await labels.click(); await satellite.click();
  await expect(page.getByTestId('map-status')).toContainText('Natural Earth');
  fail = true; await satellite.click();
  await expect(page.getByRole('status').filter({ hasText: 'Esri unavailable' })).toBeVisible();
  await satellite.click();
  await expect(page.getByTestId('map-status')).toContainText('Natural Earth');
});
