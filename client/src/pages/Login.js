import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaGithub, FaLinkedin, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!credentials.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset login error
    setLoginError('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // In real app, call your API endpoint
      // const response = await api.post('/auth/login', credentials);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock response
      const response = {
        data: {
          token: 'mock-jwt-token',
          user: {
            id: '1',
            name: 'Test User',
            email: credentials.email,
          },
        },
      };
      
      // Store token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSocialLogin = (provider) => {
    // Implement social login logic
    console.log(`Login with ${provider}`);
    
    // For now, just simulate successful login
    localStorage.setItem('token', 'mock-social-jwt-token');
    localStorage.setItem('user', JSON.stringify({
      id: '2',
      name: 'Social User',
      email: 'social@example.com',
      provider,
    }));
    
    navigate('/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your CV Optimizer account</p>
        </div>
        
        {loginError && (
          <div className="alert alert-danger">
            <p>{loginError}</p>
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleShowPassword}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <div className="error-message">{errors.password}</div>}
            <div className="forgot-password">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>
          
          <div className="auth-actions">
            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
        
        <div className="auth-divider">Or continue with</div>
        
        <div className="social-auth">
          <button 
            type="button" 
            className="social-button google-button"
            onClick={() => handleSocialLogin('google')}
          >
            <FaGoogle />
            <span>Continue with Google</span>
          </button>
          
          <button 
            type="button" 
            className="social-button github-button"
            onClick={() => handleSocialLogin('github')}
          >
            <FaGithub />
            <span>Continue with GitHub</span>
          </button>
          
          <button 
            type="button" 
            className="social-button linkedin-button"
            onClick={() => handleSocialLogin('linkedin')}
          >
            <FaLinkedin />
            <span>Continue with LinkedIn</span>
          </button>
        </div>
        
        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
