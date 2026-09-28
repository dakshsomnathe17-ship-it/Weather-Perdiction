import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [react(), tailwindcss(), viteStaticCopy({ targets: [
    ...['Workers', 'Assets', 'Widgets', 'ThirdParty'].map((folder) => ({ src: `node_modules/cesium/Build/Cesium/${folder}`, dest: 'cesium' })),
    { src: 'node_modules/cesium/LICENSE.md', dest: 'licenses/cesium' },
    { src: 'node_modules/geographiclib-geodesic/LICENSE.txt', dest: 'licenses/geographiclib' },
  ] })],
  define: { CESIUM_BASE_URL: JSON.stringify('/cesium/') },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } }
  },
  build: { rollupOptions: { output: { manualChunks: { cesium: ['cesium'] } } } }
});
