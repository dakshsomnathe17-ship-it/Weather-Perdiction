import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';

const days = Array.from({ length: 7 }, (_, i) => ({
  date: `2026-10-${String(i + 4).padStart(2, '0')}T00:00:00`,
  temp_max: 26 + i,
  temp_min: 18 + i,
  precipitation_sum: [0, 1, 8, 2, 0, 0, 3][i],
  weather_code: i === 2 ? 61 : 2,
  description: i === 2 ? 'Slight rain' : 'Partly cloudy',
}));

async function fixture(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
  await page.route('**/api/weather/**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/current'))
      return route.fulfill({
        json: {
          temperature: 24,
          feels_like: 26,
          humidity: 72,
          wind_speed: 16,
          weather_code: 2,
          description: 'Partly cloudy',
        },
      });
    if (url.pathname.endsWith('/forecast')) return route.fulfill({ json: { forecast: days } });
    if (url.pathname.endsWith('/search'))
      return route.fulfill({
        json: [
          { name: 'Pune', country: 'India', lat: 18.5204, lon: 73.8567 },
          { name: 'Pune District', country: 'India', lat: 18.5, lon: 73.9 },
        ],
      });
    return route.fulfill({ json: { points: [] } });
  });
}

test('weather overview links to the chosen day, converts units and persists them', async ({
  page,
}, info) => {
  await fixture(page);
  await page.setViewportSize({ width: 1440, height: 1160 });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Current weather' })).toContainText('24°C');
  await expect(page.getByRole('heading', { name: '7-day forecast' })).toBeVisible();
  await expect(page.getByTestId('cesium-renderer')).toBeVisible();
  await expect(async () => {
    const screenshot = await page.locator('.cesium-widget canvas').screenshot();
    const { data, info: pixels } = await sharp(screenshot)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let lit = 0;
    for (let i = 0; i < data.length; i += pixels.channels) {
      if (data[i] > 35 && data[i + 1] > 35 && data[i + 2] > 35) lit++;
    }
    expect(lit / (pixels.width * pixels.height)).toBeGreaterThan(0.025);
  }).toPass({ timeout: 20_000 });
  await page.screenshot({ path: info.outputPath('overview-desktop.png') });
  await page.getByRole('link', { name: /Tuesday, Oct 6:/ }).click();
  await expect(page.getByLabel('Selected day details')).toContainText('Tuesday, Oct 6');
  await expect(page.getByLabel('Selected day details')).toContainText('8 mm');
  await page.getByRole('button', { name: 'Fahrenheit, miles', exact: true }).click();
  await expect(page.getByLabel('Selected day details')).toContainText('82°F');
  await expect(page.getByLabel('Selected day details')).toContainText('0.31 in');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Fahrenheit, miles', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Selected day details')).toContainText('82°F');
  await page.screenshot({ path: info.outputPath('forecast-desktop.png') });
});

test('insights summarize the actual forecast and handle an empty response', async ({ page }) => {
  await fixture(page);
  await page.goto('/analytics');
  await expect(page.getByText('14 mm', { exact: true })).toBeVisible();
  await expect(page.getByText('32°C', { exact: true }).first()).toBeVisible();
  await expect(page.locator('.insight-stat').last()).toContainText('4 / 7');
  await page.route('**/api/weather/forecast?**', (route) =>
    route.fulfill({ json: { forecast: [] } }),
  );
  await page.reload();
  await expect(page.getByText('No forecast available', { exact: true })).toBeVisible();
  await expect(page.locator('.insight-stat')).toHaveCount(0);
});

test('weather failure has a working retry without fabricated conditions', async ({ page }) => {
  await fixture(page);
  let failing = true;
  await page.route('**/api/weather/current?**', (route) =>
    route.fulfill(
      failing
        ? { status: 503, json: { detail: 'Unavailable' } }
        : {
            json: {
              temperature: 24,
              feels_like: 26,
              humidity: 72,
              wind_speed: 16,
              weather_code: 2,
              description: 'Partly cloudy',
            },
          },
    ),
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Weather is temporarily unavailable');
  await expect(page.getByRole('region', { name: 'Current weather' })).toHaveCount(0);
  failing = false;
  await page.getByRole('button', { name: 'Retry weather', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Current weather' })).toContainText('24°C');
});

test('manual search works from the forecast and Escape dismisses results', async ({ page }) => {
  await fixture(page);
  await page.goto('/forecast');
  const requests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/search?')) requests.push(r.url());
  });
  const input = page.getByRole('textbox', { name: 'Search places' });
  await input.fill('Pune');
  expect(requests).toHaveLength(0);
  await input.press('Enter');
  await expect(page.getByRole('button', { name: /Pune District/ })).toBeVisible();
  await input.press('Escape');
  await expect(page.getByRole('button', { name: /Pune District/ })).toBeHidden();
  await expect(input).toBeFocused();
});

test('model lab displays recorded scores and historical examples without live prediction calls', async ({
  page,
}, info) => {
  const predictionCalls: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/predictions')) predictionCalls.push(r.url());
  });
  await fixture(page);
  await page.goto('/ml');
  await expect(page.getByText('Research models, evaluated on the past.')).toBeVisible();
  await expect(page.locator('.model-card.chosen')).toContainText('LightGBM');
  await expect(page.locator('.model-card.chosen')).toContainText('0.807');
  await expect(page.locator('.city-scores > div')).toHaveCount(8);
  await page.getByLabel('City', { exact: true }).selectOption('Mumbai');
  await expect(page.locator('.example-grid').first()).toContainText('27.3');
  await expect(page.locator('.example-grid').first()).toContainText('ERA5 actual: 29.4');
  expect(predictionCalls).toHaveLength(0);
  await page.locator('.app-main').evaluate((e) => e.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('model-lab-desktop.png') });
});

test('mobile weather, forecast and navigation fit the viewport', async ({ browser }, info) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await fixture(page);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Current weather' })).toContainText('24°C');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeInViewport();
  await page.screenshot({ path: info.outputPath('overview-mobile.png') });
  const forecastBox = await page.locator('.forecast-panel').boundingBox(),
    globeBox = await page.locator('.map-panel').boundingBox();
  expect(forecastBox!.y).toBeLessThan(globeBox!.y);
  const destinations = [
    ['Forecast', 'The days ahead.'],
    ['Insights', 'Your week, understood.'],
    ['Model lab', 'Weather, with a learning curve.'],
    ['Settings', 'The details that matter.'],
  ];
  for (const [route, heading] of destinations) {
    await page.getByRole('navigation').getByRole('link', { name: route, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible();
    if (route === 'Forecast') await expect(page.getByLabel('Selected day details')).toBeVisible();
    if (route === 'Insights') await expect(page.locator('.rain-chart-row')).toHaveCount(7);
    expect(await page.locator('.app-main').evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
      true,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`${route.replace(' ', '-')}-mobile.png`) });
  }
  await context.close();
});
