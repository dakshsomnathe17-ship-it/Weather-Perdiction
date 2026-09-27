import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';

async function fixture(page: Page) {
  await page.route('**/api/weather/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/search')) return route.fulfill({ json: [{ id: 123, name: 'Pune', country: 'India', displayName: 'Pune, Maharashtra, India', lat: 18.5204, lon: 73.8567, bounds: [18.4, 18.7, 73.7, 74] }] });
    if (url.pathname.endsWith('/current')) return route.fulfill({ json: { temperature: 21, feels_like: 20, humidity: 65, wind_speed: 12, weather_code: 2, description: 'Partly cloudy' } });
    if (url.pathname.endsWith('/forecast')) return route.fulfill({ json: { forecast: [{ date: '2026-09-27', temp_max: 24, temp_min: 17, precipitation_sum: 0, weather_code: 2, description: 'Partly cloudy' }] } });
    return route.fulfill({ json: { layer: url.searchParams.get('layer'), points: [] } });
  });
}
async function ready(page: Page, fallback = false) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByTestId(fallback ? 'canvas-renderer' : 'cesium-renderer')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(async () => {
    const screenshot = await page.locator('canvas').first().screenshot();
    const { data, info } = await sharp(screenshot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let lit = 0;
    for (let i = 0; i < data.length; i += info.channels) if (data[i] > 35 && data[i + 1] > 35 && data[i + 2] > 35) lit++;
    expect(lit / (info.width * info.height)).toBeGreaterThan(.025);
  }).toPass({ timeout: 20000 });
}
async function center(page: Page) {
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) throw new Error('Missing canvas');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
async function disableWebGL(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
}
async function nearPune(page: Page, tolerance = .6) {
  await expect(page.getByTestId('selected-location')).not.toContainText('Pune');
  const numbers = (await page.getByTestId('selected-location').textContent())!.match(/[\d.]+/g)!.map(Number);
  expect(Math.abs(numbers[0] - 18.5204)).toBeLessThan(tolerance);
  expect(Math.abs(numbers[1] - 73.8567)).toBeLessThan(tolerance);
}

test('Cesium renders local Natural Earth, picks after rotation and rejects dragging', async ({ page }, info) => {
  const errors: string[] = [], remoteMaps: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => { if (/arcgis.com|api.cesium.com/.test(r.url())) remoteMaps.push(r.url()); });
  await fixture(page); await ready(page);
  await expect(page.getByRole('button', { name: 'Satellite imagery', exact: true })).toBeDisabled();
  const c = await center(page), selected = page.getByTestId('selected-location');
  const before = await selected.textContent();
  await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(c.x + 80, c.y + 35, { steps: 12 }); await page.mouse.up();
  await expect(selected).toHaveText(before!);
  await page.getByRole('region', { name: 'Interactive Earth' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.mouse.click(c.x, c.y);
  await expect(selected).not.toHaveText(before!);
  await page.getByRole('button', { name: 'Reset view' }).click();
  await expect(page.getByTestId('map-status')).toContainText('22,000 km');
  await page.mouse.dblclick(c.x, c.y);
  await expect(page.getByTestId('map-status')).toContainText('80 km');
  await page.screenshot({ path: info.outputPath('cesium-desktop.png') });
  expect(errors).toEqual([]); expect(remoteMaps).toEqual([]);
});

test('submitted place search flies to Pune and selects accurate coordinates', async ({ page }) => {
  const searches: string[] = [], weather: string[] = [];
  page.on('request', (r) => { if (r.url().includes('/search?')) searches.push(r.url()); if (r.url().includes('/current?')) weather.push(r.url()); });
  await fixture(page); await ready(page);
  const input = page.getByRole('textbox', { name: 'Search places' });
  await input.fill('Pune');
  expect(searches).toHaveLength(0);
  await input.press('Enter');
  await page.getByRole('button', { name: /Pune Pune, Maharashtra/ }).click();
  await expect(page.getByTestId('selected-location')).toContainText('18.5204° N, 73.8567° E');
  const c = await center(page); await page.mouse.click(c.x, c.y);
  await nearPune(page, .001);
  expect(searches).toHaveLength(1);
  expect(weather.some(url => url.includes('lat=18.5204&lon=73.8567'))).toBe(true);
});

test('distance tool measures two surface points and clears without changing weather', async ({ page }, info) => {
  await fixture(page); await ready(page);
  const before = await page.getByTestId('selected-location').textContent();
  await page.getByRole('button', { name: 'Measure distance' }).click();
  const c = await center(page);
  await page.mouse.click(c.x, c.y + 60); await page.mouse.click(c.x + 45, c.y + 60);
  await expect(page.getByTestId('surface-distance')).toContainText('km');
  await expect(page.getByTestId('surface-distance')).toContainText('WGS84');
  await expect(page.getByTestId('selected-location')).toHaveText(before!);
  // Geometry is uploaded asynchronously; verify the connector, not just its endpoints.
  await expect(async () => {
    const image = await page.screenshot({ clip: { x: Math.round(c.x + 15), y: Math.round(c.y + 55), width: 15, height: 10 } });
    const { data, info } = await sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let yellow = 0;
    for (let i = 0; i < data.length; i += info.channels) if (data[i] > 180 && data[i + 1] > 160 && data[i + 2] < 130) yellow++;
    expect(yellow).toBeGreaterThan(10);
  }).toPass({ timeout: 10000 });
  await page.screenshot({ path: info.outputPath('distance.png') });
  await page.getByRole('button', { name: 'Clear measurement' }).click();
  await expect(page.getByTestId('surface-distance')).toBeHidden();
});

test('weather layer status, opacity and map picking stay compatible', async ({ page }) => {
  await fixture(page);
  await page.route('**/api/weather/map?**', route => route.fulfill({ json: { layer: 'temperature', points: [{ lat: 18.5204, lon: 73.8567, value: 30 }] } }));
  await ready(page);
  await page.getByRole('button', { name: 'Weather Layers', exact: true }).click();
  const toggle = page.getByRole('button', { name: 'Temperature layer', exact: true });
  await toggle.click();
  await expect(page.getByRole('status').filter({ hasText: 'Temperature:' })).toContainText('°C');
  await page.getByRole('slider', { name: 'Temperature opacity' }).fill('0.3');
  await expect(page.getByRole('slider', { name: 'Temperature opacity' })).toHaveValue('0.3');
  await page.getByRole('button', { name: 'Weather Layers', exact: true }).click();
  const c = await center(page); await page.mouse.click(c.x, c.y);
  await nearPune(page);
});

test('Canvas fallback remains textured, searchable and measurable without WebGL', async ({ page }, info) => {
  await disableWebGL(page); await fixture(page); await ready(page, true);
  const c = await center(page);
  await page.mouse.click(c.x, c.y);
  await expect(page.getByTestId('selected-location')).toContainText('18.5204° N');
  await page.getByRole('textbox', { name: 'Search places' }).fill('Pune');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: /Pune Pune, Maharashtra/ }).click();
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.getByRole('button', { name: 'Measure distance' }).click();
  await page.mouse.click(c.x, c.y + 60); await page.mouse.click(c.x + 45, c.y + 60);
  await expect(page.getByTestId('surface-distance')).toContainText('km');
  await page.screenshot({ path: info.outputPath('canvas-fallback.png') });
});

test('WebGL context loss switches to the usable Canvas renderer', async ({ page }) => {
  await fixture(page); await ready(page);
  await page.locator('.cesium-widget canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.getByTestId('canvas-renderer')).toBeVisible();
  await page.getByRole('button', { name: 'Reset view' }).click();
  const c = await center(page); await page.mouse.click(c.x, c.y);
  await expect(page.getByTestId('selected-location')).toContainText('18.5204° N');
});

test('mobile touch and responsive resize', async ({ browser }, info) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage(); await fixture(page); await ready(page);
  const box = await page.getByRole('region', { name: 'Interactive Earth' }).boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  const c = await center(page); await page.touchscreen.tap(c.x, c.y);
  await nearPune(page);
  await page.screenshot({ path: info.outputPath('mobile-cesium.png') });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('canvas').first()).toBeVisible();
  await context.close();
});
