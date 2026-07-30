/**
 * Canonical origin for canonical/OG/Twitter URLs.
 *
 * Resolved at build time by scripts/site-origin.mjs and folded in through
 * Vite's `define`, so the client and the prerenderer can never disagree about
 * what domain this deployment is. Set VITE_SITE_URL to pin a custom domain;
 * on Vercel it self-configures from the deployment environment.
 */
export const SITE_URL = __SITE_URL__;
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
