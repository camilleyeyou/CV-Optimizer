import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { verifyStudent } from '../services/api';
import { SITE_URL, OG_IMAGE } from '../config/site';
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
  const navigate = useNavigate();

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
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-page">
      <Helmet>
        <title>Create Your Free Account — CV Optimizer</title>
        <meta name="description" content="Create a free CV Optimizer account and build an ATS-optimized resume with AI — 5 free AI credits, 6 templates, and an ATS score checker." />
        <link rel="canonical" href={`${SITE_URL}/register`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CV Optimizer" />
        <meta property="og:title" content="Create Your Free Account — CV Optimizer" />
        <meta property="og:description" content="Create a free CV Optimizer account and build an ATS-optimized resume with AI — free to start, no credit card required." />
        <meta property="og:url" content={`${SITE_URL}/register`} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Create Your Free Account — CV Optimizer" />
        <meta name="twitter:description" content="Create a free CV Optimizer account and build an ATS-optimized resume with AI — free to start, no credit card required." />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Helmet>
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Start building professional resumes in minutes</p>
        </div>

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
