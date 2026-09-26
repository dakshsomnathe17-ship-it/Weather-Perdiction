import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';

async function weatherFixture(page: Page) {
  await page.route('**/api/weather/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/search')) {
      return route.fulfill({ json: [{ name: 'Null Island', country: 'Atlantic Ocean', lat: 0, lon: 0 }] });
    }
    if (url.pathname.endsWith('/current')) {
      return route.fulfill({ json: { temperature: 21, feels_like: 20, humidity: 65, wind_speed: 12, weather_code: 2, description: 'Partly cloudy' } });
    }
    if (url.pathname.endsWith('/forecast')) {
      return route.fulfill({ json: { forecast: [{ date: '2026-09-26', temp_max: 24, temp_min: 17, precipitation_sum: 0, weather_code: 2, description: 'Partly cloudy' }] } });
    }
    return route.fulfill({ json: { layer: url.searchParams.get('layer'), points: [] } });
  });
}
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Loading Earth imagery…')).toBeHidden({ timeout: 20000 });
  await expect(page.locator('canvas')).toBeVisible();
  const pause = page.getByRole('button', { name: 'Pause rotation' });
  if (await pause.isVisible()) await pause.click();
  await expect(page.getByRole('button', { name: 'Resume rotation' })).toBeVisible();
}
async function center(page: Page) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Missing canvas');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
async function assertRendered(page: Page) {
  const screenshot = await page.locator('canvas').screenshot();
  const { data, info } = await sharp(screenshot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let lit = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] > 35 && data[i + 1] > 35 && data[i + 2] > 35) lit++;
  }
  expect(lit / (info.width * info.height)).toBeGreaterThan(0.04);
}

test('renders Earth, picks after rotation, rejects dragging, focuses and resets', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (/THREE.WebGLProgram|Shader Error/.test(message.text())) errors.push(message.text()); });
  await weatherFixture(page);
  await ready(page);
  await assertRendered(page);
  const globe = page.getByRole('region', { name: 'Interactive Earth' });
  const point = await center(page);
  const before = await page.getByTestId('selected-location').textContent();
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 90, point.y + 50, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByTestId('selected-location')).toHaveText(before!);
  await page.mouse.click(point.x, point.y);
  await expect(page.getByTestId('selected-location')).not.toHaveText(before!);
  await page.mouse.dblclick(point.x + 25, point.y);
  await expect(page.getByRole('button', { name: 'Resume rotation' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset view' }).click();
  await globe.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('+');
  await page.keyboard.press('r');
  await assertRendered(page);
  await page.screenshot({ path: testInfo.outputPath('desktop-earth.png') });
  expect(errors).toEqual([]);
});

test('city search focuses correct coordinates, including latitude and longitude zero', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await weatherFixture(page);
  await ready(page);
  const requests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/current')) requests.push(request.url()); });
  await page.getByPlaceholder('Search for a city...').fill('Null');
  await page.getByRole('button', { name: /Null Island/ }).click();
  await expect(page.getByTestId('selected-location')).toContainText('0.00° N, 0.00° E');
  const point = await center(page);
  await page.mouse.click(point.x, point.y);
  await expect(page.getByTestId('selected-location')).toContainText('0.00°');
  expect(requests.some((url) => url.includes('lat=0&lon=0'))).toBe(true);
  await expect(page.getByText('Not reported').first()).toBeVisible();
  await page.getByPlaceholder('Search for a city...').fill('r');
  await expect(page.getByPlaceholder('Search for a city...')).toHaveValue('r');
});

test('layers honor visibility and opacity, show empty state, and do not block picking', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await weatherFixture(page);
  await page.route('**/api/weather/map?**', (route) => route.fulfill({ json: {
    layer: 'temperature', points: [{ lat: 37.7749, lon: -122.4194, value: 22 }, { lat: 40, lon: -120, value: 24 }],
  } }));
  await ready(page);
  await page.getByRole('button', { name: 'Weather Layers', exact: true }).click();
  const toggle = page.getByRole('button', { name: 'Temperature layer', exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status').filter({ hasText: 'Temperature:' })).toContainText('°C');
  await page.getByRole('slider', { name: 'Temperature opacity' }).fill('0.3');
  await expect(page.getByRole('slider', { name: 'Temperature opacity' })).toHaveValue('0.3');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.unroute('**/api/weather/map?**');
  await page.getByRole('button', { name: 'Rainfall layer' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Rainfall:' })).toContainText('Awaiting data');
  await page.getByRole('button', { name: 'Weather Layers', exact: true }).click();
  const point = await center(page);
  await page.mouse.click(point.x, point.y);
  await expect(page.getByTestId('selected-location')).not.toContainText('San Francisco');
});

test('mobile portrait, touch selection, resize, and reduced motion', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await weatherFixture(page);
  await ready(page);
  await assertRendered(page);
  const box = await page.getByRole('region', { name: 'Interactive Earth' }).boundingBox();
  expect(box!.width).toBeGreaterThan(250);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  const point = await center(page);
  await page.touchscreen.tap(point.x, point.y);
  await expect(page.getByTestId('selected-location')).not.toContainText('San Francisco');
  await page.screenshot({ path: testInfo.outputPath('mobile-earth.png') });
  await page.setViewportSize({ width: 844, height: 390 });
  await assertRendered(page);
  await context.close();
});

test('failed imagery and weather requests remain usable and never show stale demo weather', async ({ page }) => {
  await page.route('**/textures/earth_day.jpg', (route) => route.abort());
  await page.route('**/api/weather/**', (route) => route.fulfill({ status: 503, json: { detail: 'offline' } }));
  await page.goto('/');
  await expect(page.getByText('Some imagery is unavailable. Reload to retry.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry weather', exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('18°C', { exact: true })).toBeHidden();
  const point = await center(page);
  await page.mouse.click(point.x, point.y);
  await expect(page.getByTestId('selected-location')).not.toContainText('San Francisco');
});
