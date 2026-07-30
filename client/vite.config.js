import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveSiteOrigin } from './scripts/site-origin.mjs';

/* The landing page quotes how many templates ship, and how many are free.
   Importing the registry to count them would drag ~18KB of JSON into the eager
   landing bundle for two integers, so they are folded in at build time instead.
   The registry stays the single source of truth and the numbers cannot drift. */
const registry = JSON.parse(
  readFileSync(fileURLToPath(new URL('../template-registry.json', import.meta.url)), 'utf8')
);

const TEMPLATE_COUNT = registry.templates.length;
const FREE_TEMPLATE_COUNT = registry.templates.filter((t) => !t.premium).length;

export default defineConfig({
  plugins: [react()],
  define: {
    __TEMPLATE_COUNT__: JSON.stringify(TEMPLATE_COUNT),
    __FREE_TEMPLATE_COUNT__: JSON.stringify(FREE_TEMPLATE_COUNT),
    /* Baked in rather than read through import.meta.env so the prerenderer and
       the client agree by construction — they call the same resolver. */
    __SITE_URL__: JSON.stringify(resolveSiteOrigin()),
  },
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
