import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createNonce, useGoogleIdentity } from '../../hooks/useGoogleIdentity';

/**
 * Google's mark, at its official four colours.
 *
 * Only the fallback button needs this — the Identity Services button draws its
 * own. Inlined rather than fetched because it renders before anything else on
 * the auth screens, and Google's brand terms require the mark itself.
 */
const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
    />
  </svg>
);

const FALLBACK_LABEL = { signin: 'Sign in with Google', signup: 'Sign up with Google' };
const GIS_TEXT = { signin: 'signin_with', signup: 'signup_with' };

/**
 * The Google half of the auth screens, by whichever route works here.
 *
 * Two paths, because neither covers everyone. Identity Services keeps the user
 * in the app and — because the OAuth client is used from this origin — shows a
 * consent screen naming this app instead of the Supabase project host. But GIS
 * is degraded or outright blocked inside in-app webviews (LinkedIn, WhatsApp,
 * Instagram), behind popup blockers, and in hardened privacy browsers, which is
 * a large share of traffic for a product people reach by tapping a shared link.
 * So when GIS is unavailable this silently becomes the redirect flow, which
 * works everywhere at the cost of the Supabase host appearing on the consent
 * screen. Both land on the same auth.users row.
 *
 * `next` is only consulted by the redirect path; GIS never leaves the page, so
 * those callers navigate through `onSignedIn` instead. A page that already
 * reacts to the session appearing — Register does — should leave `onSignedIn`
 * unset rather than navigate twice.
 */
const GoogleButton = ({ mode = 'signin', next = '/dashboard', onError, onSignedIn }) => {
  const { signInWithGoogle, signInWithGoogleCredential } = useAuth();
  const { status, clientId } = useGoogleIdentity();
  const [pending, setPending] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const holder = useRef(null);

  /* The auth pages pass inline callbacks, so these change identity on every
     render — every keystroke in the email field included. Reading them through
     a ref keeps them out of the effect below, which would otherwise tear down
     and redraw Google's iframe on each of those renders. */
  const handlers = useRef(null);
  handlers.current = { onError, onSignedIn, signInWithGoogleCredential };

  const handleCredential = useCallback(async (credential, rawNonce) => {
    const { onError: reportError, onSignedIn: signedIn, signInWithGoogleCredential: exchange } =
      handlers.current;

    reportError?.('');
    setPending(true);

    try {
      await exchange(credential, rawNonce);
      signedIn?.();
    } catch (err) {
      reportError?.(err.message || 'Could not complete Google sign-in. Please try again.');
      setPending(false);
    }
  }, []);

  useEffect(() => {
    if (status !== 'ready' || degraded || !holder.current) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const { raw, hashed } = await createNonce();
        if (cancelled || !holder.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          nonce: hashed,
          callback: ({ credential }) => handleCredential(credential, raw),
        });

        /* Google renders into an iframe and wants an explicit pixel width it
           will not exceed; it clamps to 200-400 regardless of what we ask. */
        window.google.accounts.id.renderButton(holder.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          shape: 'rectangular',
          text: GIS_TEXT[mode],
          logo_alignment: 'center',
          width: Math.min(400, Math.max(200, holder.current.offsetWidth || 320)),
        });
      } catch {
        /* Anything thrown here means GIS is present but unusable, which is the
           same situation as it never having loaded. */
        if (!cancelled) setDegraded(true);
      }
    })();

    return () => {
      cancelled = true;
      // Google's DOM lives outside React's tree, so a re-run would stack a
      // second button on top of the first rather than replace it.
      if (holder.current) holder.current.innerHTML = '';
    };
  }, [status, degraded, clientId, mode, handleCredential]);

  if (status === 'unavailable' || degraded) {
    const handleClick = async () => {
      onError?.('');
      setPending(true);

      try {
        await signInWithGoogle(next);
        // Success redirects. The spinner is deliberately left up — clearing it
        // would flash an idle button during the hand-off to Google.
      } catch (err) {
        onError?.(err.message || 'Could not start Google sign-in. Please try again.');
        setPending(false);
      }
    };

    return (
      <button
        type="button"
        className="btn btn-secondary btn-lg btn-block au-social"
        onClick={handleClick}
        data-loading={pending || undefined}
        disabled={pending}
      >
        <GoogleMark />
        {FALLBACK_LABEL[mode]}
      </button>
    );
  }

  return (
    <div className="au-social au-gis" data-pending={pending || undefined}>
      <div ref={holder} />
    </div>
  );
};

export default GoogleButton;
