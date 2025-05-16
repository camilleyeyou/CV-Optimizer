import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const auth = useAuth();
  
  if (!auth) {
    console.warn("Auth context not available in PrivateRoute");
    return <Navigate to="/login" />;
  }
  
  const { isAuthenticated, loading } = auth;
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default PrivateRoute;
