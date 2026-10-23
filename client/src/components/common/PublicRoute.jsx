import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Renders a public page, sending signed-in users to the dashboard instead.
 *
 * The page renders while auth is still resolving rather than waiting behind a
 * spinner. Resolving can mean a token refresh over the network, which
 * supabase-js retries for up to ~30s when Supabase is slow or paused, and a
 * public page needs nothing from it. Signed-in users see the page briefly
 * before the redirect, which beats every visitor waiting on the backend (and
 * the prerendered hero being swapped out for a spinner).
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
