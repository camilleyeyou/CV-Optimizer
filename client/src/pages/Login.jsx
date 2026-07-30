import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle } from 'lucide-react';
import Seo from '../components/common/Seo';
import AuthShell from '../components/auth/AuthShell';
import PasswordField from '../components/auth/PasswordField';
import { useAuth } from '../context/AuthContext';

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
    <>
      <Seo
        title="Sign In — CV Optimizer"
        description="Sign in to CV Optimizer to build, score, and tailor your ATS-optimized resume."
        path="/login"
      />
      <AuthShell
        title="Welcome back"
        subtitle="Sign in to pick up where you left off."
        footer={<>New here? <Link to="/register">Create a free account</Link></>}
      >
        {error && (
          <div className="alert alert-error au-alert" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form className="au-form" onSubmit={handleSubmit} noValidate={false}>
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
                aria-invalid={error ? true : undefined}
                required
              />
            </div>
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            invalid={!!error}
            action={
              <Link to="/forgot-password" className="au-link">Forgot password?</Link>
            }
          />

          <button
            type="submit"
            className="btn btn-primary btn-lg au-submit"
            data-loading={loading || undefined}
            disabled={loading}
          >
            Sign in <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>
      </AuthShell>
    </>
  );
};

export default Login;
