/**
 * Where this build thinks it lives.
 *
 * Every canonical, og:url and og:image is an absolute URL, so the origin has to
 * be known at build time — a crawler reads static HTML and never runs the app.
 *
 * This used to be a hardcoded `https://cv-optimizer.vercel.app`. That hostname
 * is not this project: it serves an unrelated Next.js site, so every share card
 * pointed og:image at a URL that 404s (no preview image), and every canonical
 * tag told search engines these pages belonged to somebody else's domain.
 *
 * The chain below means a Vercel build configures itself correctly with no
 * environment variable set at all:
 *
 *   VITE_SITE_URL                    explicit override — set this for a custom
 *                                    domain, it always wins
 *   VERCEL_PROJECT_PRODUCTION_URL    the project's stable production hostname,
 *                                    which is what a shared link resolves to
 *   VERCEL_URL                       this deployment's own hostname; correct on
 *                                    preview builds, where the production
 *                                    domain would point at different code
 *   localhost                        dev
 *
 * Vercel supplies its variables bare (`example.com`), so a scheme is added.
 */

const withScheme = (host) => {
  if (!host) return null;
  const trimmed = String(host).trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export function resolveSiteOrigin(env = process.env) {
  return (
    withScheme(env.VITE_SITE_URL)
    || withScheme(env.VERCEL_PROJECT_PRODUCTION_URL)
    || withScheme(env.VERCEL_URL)
    || 'http://localhost:3000'
  );
}

export default resolveSiteOrigin;
