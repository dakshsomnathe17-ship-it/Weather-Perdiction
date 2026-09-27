import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', testMatch: 'esri.spec.ts', timeout: 45000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4174', viewport: { width: 1440, height: 960 }, launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort', url: 'http://127.0.0.1:4174', reuseExistingServer: false,
    env: { VITE_ARCGIS_ACCESS_TOKEN: 'fixture-token', VITE_ESRI_IMAGERY_URL: 'https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer', VITE_ESRI_LABELS_URL: 'https://ibasemaps-api.arcgis.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer' } },
});
