import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * Google's mark, at its official four colours.
 *
 * Inlined rather than loaded as an asset because it renders before anything
 * else on the auth screens, and Google's brand terms require the mark itself —
 * a lucide glyph or a recoloured monochrome version is not a substitute.
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

/**
 * The Google half of the auth screens.
 *
 * Keeps its own pending flag instead of sharing the page's `loading`: the click
 * navigates away from the app, so the spinner has to outlive this component and
 * must not be cleared by whatever the email form happens to be doing.
 *
 * `next` is the in-app path to return to. Errors are handed upward via
 * `onError` so they surface in the same alert the email form uses rather than
 * in a second competing one.
 */
const GoogleButton = ({ next = '/dashboard', label = 'Continue with Google', onError }) => {
  const [pending, setPending] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleClick = async () => {
    onError?.('');
    setPending(true);

    try {
      await signInWithGoogle(next);
      // Success redirects, so the spinner is deliberately left up. Clearing it
      // here would flash an idle button during the hand-off to Google.
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
      {label}
    </button>
  );
};

export default GoogleButton;
