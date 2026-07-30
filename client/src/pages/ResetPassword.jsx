import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, Check, Circle, ShieldCheck } from 'lucide-react';
import Seo from '../components/common/Seo';
import AuthShell from '../components/auth/AuthShell';
import PasswordField from '../components/auth/PasswordField';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';

const MIN_PASSWORD = 8;

/**
 * Step two of the password reset: the page the emailed link lands on.
 *
 * This is the redirect target `resetPassword()` already points Supabase at.
 * Following the link puts a short-lived recovery session in place — either from
 * the URL fragment or from a PKCE code exchange, depending on the project's
 * flow — and `updateUser({ password })` then works against it.
 *
 * Three states, because a reset link is the one URL users reliably open late:
 *   checking  waiting for the client to settle the session out of the URL
 *   invalid   no session, or the link carried an error (expired, already used)
 *   ready     the form
 */
const ResetPassword = () => {
  const [status, setStatus] = useState('checking');
  const [linkError, setLinkError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    // Supabase reports a dead link in the fragment, and some configurations use
    // the query string instead. Read both before waiting on a session that is
    // never going to arrive.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const query = new URLSearchParams(window.location.search);
    const described = hash.get('error_description') || query.get('error_description');
    if (described) {
      setLinkError(described.replace(/\+/g, ' '));
      setStatus('invalid');
      return undefined;
    }

    // The session may already be in place, or may land a tick later once the
    // client has parsed the URL — so check once and also listen.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) setStatus('ready');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) setStatus('ready');
      else {
        // Nothing in the URL and nothing stored. Give the client a moment to
        // finish an exchange before calling the link dead.
        setTimeout(() => {
          if (cancelled) return;
          supabase.auth.getSession().then(({ data: { session: late } }) => {
            if (!cancelled) setStatus(late ? 'ready' : 'invalid');
          });
        }, 1200);
      }
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not update your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const longEnough = password.length >= MIN_PASSWORD;
  const matches = confirm.length > 0 && password === confirm;

  const seo = (
    <Seo
      title="Set a new password — CV Optimizer"
      description="Choose a new password for your CV Optimizer account."
      path="/reset-password"
      noindex
    />
  );

  if (status === 'checking') {
    return (
      <>
        {seo}
        <AuthShell title="Checking your link" subtitle="One moment.">
          <div className="au-done">
            <span className="spinner spinner-lg" />
          </div>
        </AuthShell>
      </>
    );
  }

  if (status === 'invalid') {
    return (
      <>
        {seo}
        <AuthShell
          title="This link is no longer valid"
          /* Covers all three ways it fails, including the common one: the link
             was requested on a laptop and opened on a phone. The exchange is
             tied to the browser that asked for it, so that lands here too. */
          subtitle="Reset links last one hour, work once, and have to be opened in the browser that requested them."
          footer={<Link to="/login">Back to sign in</Link>}
        >
          {linkError && (
            <div className="alert alert-error au-alert" role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{linkError}</span>
            </div>
          )}
          <div className="au-done-actions">
            <Link to="/forgot-password" className="btn btn-primary btn-lg">
              Send a new link <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </AuthShell>
      </>
    );
  }

  if (done) {
    return (
      <>
        {seo}
        <AuthShell title="Password updated">
          <div className="au-done">
            <span className="au-done-icon">
              <ShieldCheck size={22} aria-hidden="true" />
            </span>
            <p>You are signed in on this device. Other devices have been signed out.</p>
            <div className="au-done-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/dashboard', { replace: true })}
              >
                Go to dashboard <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </AuthShell>
      </>
    );
  }

  return (
    <>
      {seo}
      <AuthShell
        title="Set a new password"
        subtitle="Choose something you have not used on this account before."
      >
        {error && (
          <div className="alert alert-error au-alert" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form className="au-form" onSubmit={handleSubmit}>
          <PasswordField
            id="password"
            label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`At least ${MIN_PASSWORD} characters`}
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
            invalid={confirm.length > 0 && !matches}
          />

          <ul className="au-rules" aria-live="polite">
            <li className="au-rule" data-met={longEnough}>
              {longEnough
                ? <Check size={13} aria-hidden="true" />
                : <Circle size={13} aria-hidden="true" />}
              At least {MIN_PASSWORD} characters
            </li>
            <li className="au-rule" data-met={matches}>
              {matches
                ? <Check size={13} aria-hidden="true" />
                : <Circle size={13} aria-hidden="true" />}
              Both passwords match
            </li>
          </ul>

          <button
            type="submit"
            className="btn btn-primary btn-lg au-submit"
            data-loading={loading || undefined}
            disabled={loading}
          >
            Update password <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>
      </AuthShell>
    </>
  );
};

export default ResetPassword;
