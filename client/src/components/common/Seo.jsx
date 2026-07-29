import { useLayoutEffect } from 'react';
import { SITE_URL, OG_IMAGE } from '../../config/site';

/**
 * The single place a page declares its head tags.
 *
 * Why this is imperative instead of <Helmet>: under React 19, react-helmet-async
 * no longer manages the head - React's own metadata hoisting lifts any <title>,
 * <meta> or <link> rendered in the tree straight into <head>, and it does not
 * deduplicate against what is already there. The result was a page carrying
 * three <title>s and two <link rel="canonical">s: one set from index.html (or
 * the prerenderer), one from the app defaults, one from the page. Worse, on
 * every route that isn't prerendered the two canonicals disagreed - index.html
 * says `https://site/`, the page says its own URL - and Google's documented
 * response to conflicting canonicals is to ignore all of them. A crawler that
 * doesn't run JS saw only the index.html tag, pointing every route at the
 * homepage.
 *
 * Upserting by selector fixes that at the root: the prerendered tag is found
 * and rewritten in place, so there is exactly one of each whether the page was
 * prerendered, client-rendered, or navigated to within the SPA.
 */

const head = () => document.head;

/** Find an existing tag or create it, then set its value. */
function upsert(selector, create, apply) {
  let el = head().querySelector(selector);
  if (!el) {
    el = create();
    head().appendChild(el);
  }
  apply(el);
  return el;
}

const setMeta = (attr, key, content) => {
  if (content == null) return;
  upsert(`meta[${attr}="${key}"]`, () => {
    const el = document.createElement('meta');
    el.setAttribute(attr, key);
    return el;
  }, (el) => el.setAttribute('content', String(content)));
};

const setLink = (rel, href) => {
  if (!href) return;
  upsert(`link[rel="${rel}"]`, () => {
    const el = document.createElement('link');
    el.setAttribute('rel', rel);
    return el;
  }, (el) => el.setAttribute('href', href));
};

const removeAll = (selector) => {
  head().querySelectorAll(selector).forEach((el) => el.remove());
};

/**
 * Structured data is replaced wholesale per route rather than merged.
 *
 * Clears every ld+json block, not just the ones this component added: the
 * prerendered HTML ships the landing route's blocks inline, and leaving those
 * behind meant a template page carried the gallery's CollectionPage alongside
 * its own SoftwareApplication. <Seo> is the only thing that emits structured
 * data, so it owns all of it.
 */
const setJsonLd = (blocks) => {
  removeAll('script[type="application/ld+json"]');
  blocks.forEach((block) => {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-seo', '');
    el.textContent = JSON.stringify(block);
    head().appendChild(el);
  });
};

const Seo = ({
  title,
  description,
  path,
  image = OG_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd = null,
}) => {
  const url = path != null ? `${SITE_URL}${path}` : null;
  // Serialised so the effect re-runs on content change, not on identity change.
  const ldKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useLayoutEffect(() => {
    if (title) {
      upsert('title', () => document.createElement('title'), (el) => { el.textContent = title; });
    }
    setMeta('name', 'description', description);
    setLink('canonical', url);

    if (noindex) setMeta('name', 'robots', 'noindex');
    else removeAll('meta[name="robots"]');

    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', 'CV Optimizer');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);

    setJsonLd(ldKey ? [].concat(JSON.parse(ldKey)).filter(Boolean) : []);
  }, [title, description, url, image, type, noindex, ldKey]);

  return null;
};

/**
 * Baseline tags for pages that declare no <Seo> of their own (the authenticated
 * app, which robots.txt keeps out of the index anyway). Sets no canonical: a
 * wrong canonical is worse than none, and every public page declares its own.
 */
export const SeoDefaults = () => {
  useLayoutEffect(() => {
    setMeta('property', 'og:site_name', 'CV Optimizer');
    setMeta('property', 'og:image', OG_IMAGE);
    setMeta('name', 'twitter:card', 'summary_large_image');
  }, []);
  return null;
};

export default Seo;
