import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { SITE_URL, OG_IMAGE } from '../config/site';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Helmet>
        <title>Sign In — CV Optimizer</title>
        <meta name="description" content="Sign in to CV Optimizer to build, score, and tailor your ATS-optimized resume." />
        <link rel="canonical" href={`${SITE_URL}/login`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CV Optimizer" />
        <meta property="og:title" content="Sign In — CV Optimizer" />
        <meta property="og:description" content="Sign in to CV Optimizer to build, score, and tailor your ATS-optimized resume." />
        <meta property="og:url" content={`${SITE_URL}/login`} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sign In — CV Optimizer" />
        <meta name="twitter:description" content="Sign in to CV Optimizer to build, score, and tailor your ATS-optimized resume." />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Helmet>
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to continue building your resume</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input has-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="password">Password</label>
              <span className="form-link form-link-disabled">Forgot password?</span>
            </div>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input has-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? (
              <span className="spinner" />
            ) : (
              <>Sign in <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
