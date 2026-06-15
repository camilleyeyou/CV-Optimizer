// Canonical site origin used for canonical/OG/Twitter URLs. Override with
// VITE_SITE_URL in the environment when a custom domain is set.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://cv-optimizer.vercel.app').replace(/\/$/, '');
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
