import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail, User, ArrowRight, AlertCircle, Check, Circle, MailCheck,
} from 'lucide-react';
import Seo from '../components/common/Seo';
import AuthShell from '../components/auth/AuthShell';
import GoogleButton from '../components/auth/GoogleButton';
import PasswordField from '../components/auth/PasswordField';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import { isTemplateSlug } from '../config/templateContent';
import { getTemplate } from '../config/templates';

const MIN_PASSWORD = 8;

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const { signUp, user, loading: authLoading } = useAuth();
  const { createResume } = useResume();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Carried from a "Use this template" click on a public template page, so the
  // choice survives signup instead of dropping the user on an empty dashboard.
  const rawTemplate = searchParams.get('template');
  const preselected = rawTemplate && isTemplateSlug(rawTemplate) ? rawTemplate : null;

  // Whichever path signed the user up owns the hand-off. Set before the account
  // exists so the effect below cannot race the email form to it.
  const handedOff = useRef(false);

  /**
   * Where a new account goes. Honours a preselected template by opening its
   * builder directly; a failure there must not strand someone who has just
   * signed up, so it falls through to the dashboard.
   */
  const goAfterAuth = useCallback(async () => {
    if (preselected) {
      try {
        const resume = await createResume(preselected);
        if (resume?.id) {
          navigate(`/builder/${resume.id}`, { replace: true });
          return;
        }
      } catch { /* fall through to the dashboard */ }
    }
    navigate('/dashboard', { replace: true });
  }, [preselected, createResume, navigate]);

  /**
   * Google returns to this page rather than straight to the dashboard whenever a
   * template was carried in, because this page is what knows how to spend it.
   * The redirect is a full page load, so the ref starts false here and this runs
   * once, as soon as the exchanged session lands.
   *
   * It also covers an already-signed-in visitor arriving with `?template=`,
   * whose intent is the same.
   */
  useEffect(() => {
    if (authLoading || !user || handedOff.current) return;
    handedOff.current = true;
    goAfterAuth();
  }, [authLoading, user, goAfterAuth]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setLoading(true);
    // Claimed before the account exists so the effect above cannot navigate out
    // from under this handler once the session appears.
    handedOff.current = true;

    try {
      const data = await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        // Bring a confirmed user back here rather than to the site root, so the
        // effect above can still spend a preselected template.
        emailRedirectTo: `${window.location.origin}${
          preselected ? `/register?template=${preselected}` : '/register'
        }`,
      });

      // No session means the project requires email confirmation, so there is
      // nothing to navigate to yet — the account exists but cannot act. Saying
      // so beats bouncing the user to a dashboard that will reject them.
      if (!data?.session) {
        handedOff.current = false;
        setAwaitingConfirmation(true);
        return;
      }

      await goAfterAuth();
    } catch (err) {
      // Hand the job back: if signup itself succeeded and something later threw,
      // the effect above is now the only thing that will move the user on.
      handedOff.current = false;
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const longEnough = formData.password.length >= MIN_PASSWORD;
  const matches = formData.confirmPassword.length > 0
    && formData.password === formData.confirmPassword;

  /* Only reachable on a project that requires email confirmation: the account
     exists but has no session, so every onward route would reject it. */
  if (awaitingConfirmation) {
    return (
      <>
        <Seo title="Confirm your email — CV Optimizer" path="/register" noindex />
        <AuthShell
          title="Confirm your email"
          footer={<>Already confirmed? <Link to="/login">Sign in</Link></>}
        >
          <div className="au-done">
            <span className="au-done-icon">
              <MailCheck size={22} aria-hidden="true" />
            </span>
            <p>
              Your account is created. Click the link we sent to{' '}
              <strong>{formData.email}</strong> to activate it
              {preselected && <> — your {getTemplate(preselected).name} template is waiting</>}.
            </p>
          </div>
        </AuthShell>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Create Your Free Account — CV Optimizer"
        description="Create a free CV Optimizer account and build an ATS-optimized resume with AI — free to start, no credit card required."
        path="/register"
      />
      <AuthShell
        title="Create your account"
        subtitle={
          preselected
            ? `You will start on the ${getTemplate(preselected).name} template. You can change it any time.`
            : 'Free to start. No card required.'
        }
        footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
      >
        {preselected && (
          <div className="au-banner">
            <img
              src={`/template-previews/${preselected}.png`}
              alt=""
              width="1191"
              height="1685"
              loading="lazy"
              decoding="async"
            />
            <div className="au-banner-text">
              <p className="au-banner-title">{getTemplate(preselected).name} template</p>
              <p className="au-banner-desc">Opens in the builder as soon as you sign up.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error au-alert" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* No onSignedIn: the effect above already reacts to a session appearing
            and knows how to spend a preselected template, so passing one would
            navigate twice. `next` is for the redirect fallback only, and returns
            here rather than to the dashboard when a template is in play so that
            same effect gets its turn. `preselected` is validated against the
            registry, so it is safe to put in the URL. */}
        <GoogleButton
          mode="signup"
          next={preselected ? `/register?template=${preselected}` : '/dashboard'}
          onError={setError}
        />
        <div className="au-divider">or</div>

        <form className="au-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First name</label>
              <div className="input-wrap">
                <User size={16} aria-hidden="true" />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Ada"
                  autoComplete="given-name"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Lovelace"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="input-wrap">
              <Mail size={16} aria-hidden="true" />
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <PasswordField
            id="password"
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            placeholder={`At least ${MIN_PASSWORD} characters`}
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
          />

          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Type it again"
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
            invalid={formData.confirmPassword.length > 0 && !matches}
          />

          {/* Stated up front and checked live. The same two rules are enforced
              in handleSubmit — this only tells you where you stand before you
              hit a wall. */}
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
            Create account <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>

        {/* Outside the form, and last in the card, because it now governs both
            ways of creating an account rather than only the one above it. */}
        <p className="au-consent">
          By creating an account you agree to the{' '}
          <Link to="/terms">Terms of Service</Link> and{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </AuthShell>
    </>
  );
};

export default Register;
