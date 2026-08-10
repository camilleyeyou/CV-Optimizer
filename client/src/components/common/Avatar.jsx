import { useState } from 'react';

/**
 * A user's profile picture, falling back to their initial.
 *
 * Two things make the fallback load-bearing rather than defensive. Google's
 * avatar URLs are served from googleusercontent.com, which refuses requests
 * carrying a referrer — without `no-referrer` the image fails for every Google
 * user. Those URLs also expire and rate-limit, and an email-signup user has no
 * picture at all. So a broken image has to degrade to the initial silently,
 * never to an empty circle.
 *
 * Decorative by design: `alt` is empty because the name is always rendered
 * beside it and the surrounding control carries its own label.
 */
const Avatar = ({ url, initial, className = 'user-avatar' }) => {
  const [failed, setFailed] = useState(false);

  if (!url || failed) return <span className={className}>{initial}</span>;

  return (
    <img
      className={className}
      src={url}
      alt=""
      width="28"
      height="28"
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
};

export default Avatar;
