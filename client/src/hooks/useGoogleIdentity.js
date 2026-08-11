import { useEffect, useState } from 'react';

const SRC = 'https://accounts.google.com/gsi/client';
const LOAD_TIMEOUT_MS = 6000;

/* One load per page, shared by every mount that asks for it. */
let loader = null;

const load = () => {
  if (loader) return loader;

  loader = new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = SRC;
    script.async = true;
    script.defer = true;

    /* The timeout is the important part. In an in-app webview that silently
       drops the request, the script fires neither load nor error — without a
       deadline the button would sit blank forever instead of falling back to
       the redirect flow, which is exactly the environment where the redirect is
       the only thing that works. */
    const timer = setTimeout(() => resolve(false), LOAD_TIMEOUT_MS);

    script.onload = () => {
      clearTimeout(timer);
      resolve(!!window.google?.accounts?.id);
    };
    script.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return loader;
};

/**
 * Whether Google Identity Services can be used on this page.
 *
 * Resolves to 'unavailable' rather than throwing whenever GIS cannot be relied
 * on — no client ID configured, script blocked, or nothing loaded before the
 * deadline. Callers are expected to treat that as "use the redirect flow", not
 * as an error worth showing anyone.
 *
 * @returns {{status: 'loading'|'ready'|'unavailable', clientId: string}}
 */
export const useGoogleIdentity = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [status, setStatus] = useState(clientId ? 'loading' : 'unavailable');

  useEffect(() => {
    if (!clientId) return undefined;

    let alive = true;
    load().then((ok) => {
      if (alive) setStatus(ok ? 'ready' : 'unavailable');
    });

    return () => { alive = false; };
  }, [clientId]);

  return { status, clientId };
};

/**
 * A nonce pair for the ID token exchange.
 *
 * Google embeds the **hashed** value in the token it issues; Supabase hashes
 * the **raw** value we hand it and compares the two. Sending the same form to
 * both is the classic failure here, and it surfaces as "Passed nonce and nonce
 * in id_token should either both exist or not" — a message that points nowhere
 * near the actual mistake.
 *
 * Hex-encoded SHA-256 because that is the encoding Supabase compares against.
 *
 * @returns {Promise<{raw: string, hashed: string}>}
 */
export const createNonce = async () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '');

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { raw, hashed };
};
