import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ResumeProvider } from './context/ResumeContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ErrorBoundary from './components/common/ErrorBoundary';
import PrivateRoute from './components/common/PrivateRoute';
import PublicRoute from './components/common/PublicRoute';
import Skeleton, { SkeletonCard } from './components/common/Skeleton';
// LandingPage is the entry point — keep it eager. Everything else is
// code-split so the initial bundle stays small.
import LandingPage from './pages/LandingPage';
import './styles.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Builder = lazy(() => import('./pages/Builder'));
const Templates = lazy(() => import('./pages/Templates'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ATSChecker = lazy(() => import('./pages/ATSChecker'));
const AICreator = lazy(() => import('./pages/AICreator'));
const CoverLetter = lazy(() => import('./pages/CoverLetter'));
const Tracker = lazy(() => import('./pages/Tracker'));
const InterviewPrep = lazy(() => import('./pages/InterviewPrep'));
const EmailGenerator = lazy(() => import('./pages/EmailGenerator'));
const Analytics = lazy(() => import('./pages/Analytics'));
const SharedResume = lazy(() => import('./pages/SharedResume'));

const PageFallback = () => (
  <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
    <Skeleton width="40%" height="2rem" />
    <div style={{ height: '1rem' }} />
    <SkeletonCard />
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <ResumeProvider>
            <ErrorBoundary>
              <div className="app">
                <Header />
                <main className="main-content">
                  <Suspense fallback={<PageFallback />}>
                  <Routes>
                    {/* Public */}
                    <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/share/:token" element={<SharedResume />} />

                    {/* Protected */}
                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/templates" element={<PrivateRoute><Templates /></PrivateRoute>} />
                    <Route path="/builder" element={<PrivateRoute><Builder /></PrivateRoute>} />
                    <Route path="/builder/:id" element={<PrivateRoute><Builder /></PrivateRoute>} />
                    <Route path="/ats-checker" element={<PrivateRoute><ATSChecker /></PrivateRoute>} />
                    <Route path="/ai-creator" element={<PrivateRoute><AICreator /></PrivateRoute>} />
                    <Route path="/cover-letter" element={<PrivateRoute><CoverLetter /></PrivateRoute>} />
                    <Route path="/tracker" element={<PrivateRoute><Tracker /></PrivateRoute>} />
                    <Route path="/interview-prep" element={<PrivateRoute><InterviewPrep /></PrivateRoute>} />
                    <Route path="/emails" element={<PrivateRoute><EmailGenerator /></PrivateRoute>} />
                    <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    fontSize: '14px',
                    borderRadius: '8px',
                    padding: '12px 16px',
                  },
                }}
              />
            </ErrorBoundary>
          </ResumeProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
