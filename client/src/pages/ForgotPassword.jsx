import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, MailCheck } from 'lucide-react';
import Seo from '../components/common/Seo';
import AuthShell from '../components/auth/AuthShell';
import { useAuth } from '../context/AuthContext';

/**
 * Step one of the password reset: ask Supabase to email a recovery link.
 *
 * The confirmation deliberately does not say whether an account exists for the
 * address. Telling a stranger "no account found" turns this form into a way to
 * enumerate who has signed up, so the same message is shown either way.
 */
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      // Only surfaced for real failures — rate limits, a misconfigured project,
      // no network. An unknown address resolves successfully and is silent.
      setError(err.message || 'Could not send the reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <Seo title="Check your email — CV Optimizer" path="/forgot-password" noindex />
        <AuthShell
          title="Check your email"
          footer={<Link to="/login">Back to sign in</Link>}
        >
          <div className="au-done">
            <span className="au-done-icon">
              <MailCheck size={22} aria-hidden="true" />
            </span>
            <p>
              If an account exists for <strong>{email}</strong>, a link to set a new
              password is on its way. It expires in one hour.
            </p>
            <div className="au-done-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setSent(false); setError(''); }}
              >
                Use a different address
              </button>
            </div>
          </div>
        </AuthShell>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Reset your password — CV Optimizer"
        description="Request a link to set a new CV Optimizer password."
        path="/forgot-password"
        noindex
      />
      <AuthShell
        title="Reset your password"
        subtitle="Enter the email you signed up with and we will send a link to set a new one."
        footer={<>Remembered it? <Link to="/login">Sign in</Link></>}
      >
        {error && (
          <div className="alert alert-error au-alert" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form className="au-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="input-wrap">
              <Mail size={16} aria-hidden="true" />
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg au-submit"
            data-loading={loading || undefined}
            disabled={loading}
          >
            Send reset link <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>
      </AuthShell>
    </>
  );
};

export default ForgotPassword;
