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
async function noLocationDot(page: Page) {
  const c = await center(page);
  const patch = await page.screenshot({ clip: { x: Math.round(c.x - 8), y: Math.round(c.y - 8), width: 16, height: 16 } });
  const { data, info } = await sharp(patch).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let cyan = 0;
  for (let i = 0; i < data.length; i += info.channels) if (data[i] < 60 && data[i + 1] > 200 && data[i + 2] > 200) cyan++;
  expect(cyan).toBe(0);
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
  page.on('request', (r) => { if (/arcgis.com|(?:api|ion|assets).cesium.com/.test(r.url())) remoteMaps.push(r.url()); });
  await fixture(page); await ready(page);
  const homeStatus = await page.getByTestId('map-status').textContent();
  await noLocationDot(page);
  await expect(page.locator('.cesium-widget-credits')).toContainText('Natural Earth');
  await expect(page.locator('.cesium-widget-credits img')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('earth-overview.png') });
  await expect(page.getByRole('button', { name: 'Satellite imagery', exact: true })).toBeDisabled();
  const c = await center(page), selected = page.getByTestId('selected-location');
  const before = await selected.textContent();
  await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(c.x + 80, c.y + 35, { steps: 12 }); await page.mouse.up();
  await expect(selected).toHaveText(before!);
  await expect(page.getByRole('region', { name: 'Interactive Earth' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.mouse.click(c.x, c.y);
  await expect(selected).not.toHaveText(before!);
  await page.getByRole('button', { name: 'Reset view' }).click();
  await expect(page.getByTestId('map-status')).toHaveText(homeStatus!);
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
  await noLocationDot(page);
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
  const topPixel = await page.getByTestId('canvas-renderer').evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const color = canvas.getContext('2d')!.getImageData(canvas.width / 2, canvas.height * .05, 1, 1).data;
    return [color[0], color[1], color[2]];
  });
  expect(topPixel.every(channel => channel < 50)).toBe(true);
  const c = await center(page);
  await page.mouse.click(c.x, c.y);
  await expect(page.getByTestId('selected-location')).toContainText('18.5204° N');
  await noLocationDot(page);
  await page.getByRole('textbox', { name: 'Search places' }).fill('Pune');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: /Pune Pune, Maharashtra/ }).click();
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.getByRole('button', { name: 'Measure distance' }).click();
  await page.mouse.click(c.x, c.y + 60); await page.mouse.click(c.x + 45, c.y + 60);
  await expect(page.getByTestId('surface-distance')).toContainText('km');
  await page.screenshot({ path: info.outputPath('canvas-fallback.png') });
});

test('editing a submitted search hides results for the old query', async ({ page }) => {
  await fixture(page); await ready(page);
  const input = page.getByRole('textbox', { name: 'Search places' });
  await input.fill('Pune'); await input.press('Enter');
  await expect(page.getByRole('button', { name: /Pune Pune, Maharashtra/ })).toBeVisible();
  await input.fill('Mumbai');
  await expect(page.getByRole('button', { name: /Pune Pune, Maharashtra/ })).toBeHidden();
});

test('Canvas fallback frames broad and precise search results differently', async ({ page }) => {
  await disableWebGL(page); await fixture(page);
  await page.route('**/api/weather/search?**', route => {
    const broad = new URL(route.request().url()).searchParams.get('q') === 'World';
    return route.fulfill({ json: [{ id: broad ? 1 : 2, name: broad ? 'World' : 'Address', country: 'India',
      displayName: broad ? 'World broad area' : 'Address precise area', lat: 18.5204, lon: 73.8567,
      bounds: broad ? [-90, 90, -180, 180] : [18.52, 18.521, 73.856, 73.857] }] });
  });
  await ready(page, true);
  const input = page.getByRole('textbox', { name: 'Search places' });
  const topPixel = () => page.getByTestId('canvas-renderer').evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    return [...canvas.getContext('2d')!.getImageData(canvas.width / 2, canvas.height * .05, 1, 1).data].slice(0, 3);
  });
  await input.fill('World'); await input.press('Enter');
  await page.getByRole('button', { name: /World broad area/ }).click();
  await expect.poll(async () => (await topPixel()).every(channel => channel < 50)).toBe(true);
  await input.fill('Address'); await input.press('Enter');
  await page.getByRole('button', { name: /Address precise area/ }).click();
  await expect.poll(async () => Math.max(...await topPixel())).toBeGreaterThan(60);
});

test('Canvas drag resumes after one finger lifts from a pinch', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage(); await disableWebGL(page); await fixture(page); await ready(page, true);
  const canvas = page.getByTestId('canvas-renderer'), c = await center(page);
  const cdp = await context.newCDPSession(page);
  const finger = (id: number, x: number, y: number) => ({ id, x, y });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger(1, c.x - 20, c.y), finger(2, c.x + 20, c.y)] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [finger(1, c.x - 35, c.y), finger(2, c.x + 35, c.y)] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [finger(2, c.x + 35, c.y)] });
  const afterPinch = await canvas.screenshot();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [finger(1, c.x - 35, c.y + 50)] });
  await expect.poll(async () => (await canvas.screenshot()).equals(afterPinch)).toBe(false);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByTestId('selected-location')).toContainText('Pune');
  await context.close();
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

test('full screen retains layers and selection, and restores the dashboard', async ({ page }, info) => {
  await fixture(page); await ready(page);
  const globe = page.getByRole('region', { name: 'Interactive Earth' });
  const initialBox = await globe.boundingBox();
  await page.getByRole('button', { name: 'Full screen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Exit full screen', exact: true })).toBeVisible();
  await expect.poll(async () => Math.round((await globe.boundingBox())!.width)).toBe(1440);
  await expect(page.getByRole('button', { name: 'Weather Layers', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  const c = await center(page); await page.mouse.click(c.x, c.y);
  await nearPune(page);
  await noLocationDot(page);
  await page.screenshot({ path: info.outputPath('earth-fullscreen.png') });
  await page.getByRole('button', { name: 'Exit full screen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Full screen', exact: true })).toBeVisible();
  await expect.poll(async () => Math.round((await globe.boundingBox())!.width)).toBe(Math.round(initialBox!.width));
  await expect(page.getByRole('textbox', { name: 'Search places' })).toBeVisible();
});
