import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    fs: {
      // Allow importing the shared template-registry.json from the repo root.
      allow: ['..'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
  },
});
