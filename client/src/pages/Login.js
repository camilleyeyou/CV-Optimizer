import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setApiResponse(null);
    setIsLoading(true);
    
    try {
      // First, try a direct API call to diagnose the issue
      try {
        const directResponse = await fetch('/api/health');
        const directData = await directResponse.text();
        console.log('Direct API health check:', directData);
      } catch (healthErr) {
        console.warn('Health check failed:', healthErr);
      }
      
      console.log('Attempting login with:', { email, password: '****' });
      const response = await login(email, password);
      console.log('Login response:', response);
      setApiResponse(response);
      navigate(from, { replace: true }); // Redirect to the page they were trying to access
    } catch (err) {
      console.error('Login error details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to login. Please check your credentials.');
      setApiResponse({
        error: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to access your resume builder</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
            <div className="forgot-password">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>
          
          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Sign up</Link></p>
          <Link to="/test-api">Test API Connection</Link>
        </div>
        
        {apiResponse && (
          <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <h4>API Response:</h4>
            <pre style={{ 
              maxHeight: '200px', 
              overflow: 'auto', 
              background: '#eee', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
