import { useEffect, useState, useCallback } from 'react';
import { getCredits } from '../services/api';

/**
 * The current plan and remaining AI credits.
 *
 * Gating is enforced server-side; this exists so the UI can say what will
 * happen *before* a click rather than after a 403. Three surfaces need the same
 * answer (the template switcher, translate, tailor) and each was fetching it
 * separately or — in translate's case — not at all, so a free user got a spinner
 * and then "Failed to translate resume" for a feature they were never allowed
 * to use.
 *
 * Cached for the page session: re-opening a modal must not make locked cards
 * flash a "checking" state every time.
 */

let cached = null;

const load = () => {
  if (!cached) {
    cached = getCredits()
      .then((d) => ({
        plan: d?.plan || 'free',
        credits: d?.credits ?? 0,
        maxCredits: d?.max_credits ?? 0,
      }))
      .catch(() => {
        cached = null; // let a later mount retry
        // Fail open, matching the server's own enforceTemplateAccess: a
        // transient profile lookup must not lock a paying user out of what
        // they bought. Every gate is still enforced on the server.
        return { plan: 'unknown', credits: null, maxCredits: null };
      });
  }
  return cached;
};

/** Drop the cache so the next read is fresh — after an upgrade, or a spend. */
export const invalidatePlan = () => { cached = null; };

export const usePlan = () => {
  const [state, setState] = useState(null);

  const refresh = useCallback(() => {
    invalidatePlan();
    load().then(setState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().then((v) => { if (!cancelled) setState(v); });
    return () => { cancelled = true; };
  }, []);

  const plan = state?.plan ?? null;

  return {
    ...(state ?? { plan: null, credits: null, maxCredits: null }),
    // null while the first read is in flight, so callers can hold a neutral
    // state instead of briefly rendering a lock at a subscriber.
    loading: state === null,
    // 'unknown' means the lookup failed; treat it as entitled, as the server does.
    isPro: plan === 'pro' || plan === 'premium' || plan === 'unknown',
    refresh,
  };
};

export default usePlan;
