import { useState } from 'react';
import Seo from '../components/common/Seo';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verifyStudent } from '../services/api';
import { useResume } from '../context/ResumeContext';
import { isTemplateSlug } from '../config/templateContent';
import { getTemplate } from '../config/templates';
import { Mail, Lock, User, ArrowRight, GraduationCap } from 'lucide-react';
import './Auth.css';

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

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
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


  return (
    <div className="auth-page">
      <Seo
        title="Create Your Free Account — CV Optimizer"
        description="Create a free CV Optimizer account and build an ATS-optimized resume with AI — free to start, no credit card required."
        path="/register"
      />
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create your account</h1>
          <p>
            {preselected
              ? `You'll start with the ${getTemplate(preselected).name} template — you can change it any time.`
              : 'Start building professional resumes in minutes'}
          </p>
        </div>

        {preselected && (
          <div className="auth-preselect">
            <img
              src={`/template-previews/${preselected}.png`}
              alt=""
              width="1191"
              height="1685"
              loading="lazy"
              decoding="async"
            />
            <span>{getTemplate(preselected).name} template selected</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First name</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="form-input has-icon"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
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
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                className="form-input has-icon"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                name="password"
                type="password"
                className="form-input has-icon"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-input has-icon"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : (
              <>Create account <ArrowRight size={16} /></>
            )}
          </button>

          <p className="auth-consent">
            By creating an account, you agree to our{' '}
            <Link to="/terms">Terms of Service</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </form>

        {formData.email && /\.(edu|ac\.[a-z]{2})$/i.test(formData.email.split('@')[1] || '') && (
          <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
            <GraduationCap size={16} />
            <span>Student email detected! You&apos;ll get Pro features free for 6 months.</span>
          </div>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
