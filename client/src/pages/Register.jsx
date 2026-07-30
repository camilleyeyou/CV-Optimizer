import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail, User, ArrowRight, GraduationCap, AlertCircle, Check, Circle,
} from 'lucide-react';
import Seo from '../components/common/Seo';
import AuthShell from '../components/auth/AuthShell';
import PasswordField from '../components/auth/PasswordField';
import { useAuth } from '../context/AuthContext';
import { verifyStudent } from '../services/api';
import { useResume } from '../context/ResumeContext';
import { isTemplateSlug } from '../config/templateContent';
import { getTemplate } from '../config/templates';

const MIN_PASSWORD = 8;
const STUDENT_DOMAIN = /\.(edu|ac\.[a-z]{2})$/i;

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

  const { signUp } = useAuth();
  const { createResume } = useResume();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Carried from a "Use this template" click on a public template page, so the
  // choice survives signup instead of dropping the user on an empty dashboard.
  const rawTemplate = searchParams.get('template');
  const preselected = rawTemplate && isTemplateSlug(rawTemplate) ? rawTemplate : null;

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

    try {
      await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      // Auto-verify student emails
      const domain = formData.email.split('@')[1] || '';
      if (/\.edu$/i.test(domain) || /\.ac\.[a-z]{2}$/i.test(domain)) {
        try { await verifyStudent(); } catch { /* non-blocking */ }
      }
      // Honour a preselected template by opening its builder directly. A
      // failure here must not strand a user who has just signed up, so it
      // falls back to the dashboard.
      if (preselected) {
        try {
          const resume = await createResume(preselected);
          if (resume?.id) {
            navigate(`/builder/${resume.id}`);
            return;
          }
        } catch { /* fall through to the dashboard */ }
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const isStudent = STUDENT_DOMAIN.test(formData.email.split('@')[1] || '');
  const longEnough = formData.password.length >= MIN_PASSWORD;
  const matches = formData.confirmPassword.length > 0
    && formData.password === formData.confirmPassword;

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

        {/* Above the form, not below the button: the offer is only useful if it
            is read before the decision, and a .edu address is worth six months
            of Pro. */}
        {isStudent && (
          <div className="au-banner">
            <span className="au-banner-icon">
              <GraduationCap size={17} aria-hidden="true" />
            </span>
            <div className="au-banner-text">
              <p className="au-banner-title">Student email recognised</p>
              <p className="au-banner-desc">Pro is free for six months on this address.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error au-alert" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

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

          <p className="au-consent">
            By creating an account you agree to the{' '}
            <Link to="/terms">Terms of Service</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </form>
      </AuthShell>
    </>
  );
};

export default Register;
