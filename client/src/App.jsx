import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ResumeProvider } from './context/ResumeContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ErrorBoundary from './components/common/ErrorBoundary';
import PrivateRoute from './components/common/PrivateRoute';
import PublicRoute from './components/common/PublicRoute';
import { SeoDefaults } from './components/common/Seo';
import Skeleton, { SkeletonCard } from './components/common/Skeleton';
// LandingPage is the entry point — keep it eager. Everything else is
// code-split so the initial bundle stays small.
import LandingPage from './pages/LandingPage';
import './styles.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Builder = lazy(() => import('./pages/Builder'));
const Templates = lazy(() => import('./pages/Templates'));
const TemplateDetail = lazy(() => import('./pages/TemplateDetail'));
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
const Account = lazy(() => import('./pages/Account'));
const Privacy = lazy(() => import('./pages/legal/Privacy'));
const Terms = lazy(() => import('./pages/legal/Terms'));
const Refund = lazy(() => import('./pages/legal/Refund'));
const NotFound = lazy(() => import('./pages/NotFound'));
// Internal design-system reference. Lazy, unlinked from any nav, and noindex —
// it costs nothing on the main bundle but stays reachable on deploy previews.
const UiShowcase = lazy(() => import('./pages/dev/UiShowcase'));

const PageFallback = () => (
  <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
    <Skeleton width="40%" height="2rem" />
    <div style={{ height: '1rem' }} />
    <SkeletonCard />
  </div>
);

function App() {
  return (
    <>
      <SeoDefaults />
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
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/refund" element={<Refund />} />
                    {/* Public and indexable: the template gallery is a top-of-funnel
                        SEO surface, not an app screen. */}
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/templates/:slug" element={<TemplateDetail />} />

                    {/* Protected */}
                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/builder" element={<PrivateRoute><Builder /></PrivateRoute>} />
                    <Route path="/builder/:id" element={<PrivateRoute><Builder /></PrivateRoute>} />
                    <Route path="/ats-checker" element={<PrivateRoute><ATSChecker /></PrivateRoute>} />
                    <Route path="/ai-creator" element={<PrivateRoute><AICreator /></PrivateRoute>} />
                    <Route path="/cover-letter" element={<PrivateRoute><CoverLetter /></PrivateRoute>} />
                    <Route path="/tracker" element={<PrivateRoute><Tracker /></PrivateRoute>} />
                    <Route path="/interview-prep" element={<PrivateRoute><InterviewPrep /></PrivateRoute>} />
                    <Route path="/emails" element={<PrivateRoute><EmailGenerator /></PrivateRoute>} />
                    <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
                    <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />

                    {/* Internal — design system reference, not in any nav */}
                    <Route path="/dev/ui" element={<UiShowcase />} />

                    {/* Fallback — friendly 404 (noindex) instead of a silent redirect */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
              <Toaster
                position="bottom-right"
                gutter={10}
                toastOptions={{
                  duration: 3500,
                  // Pulled from the token layer so toasts stay in step with the
                  // rest of the system rather than drifting on their own.
                  style: {
                    background: 'var(--surface-overlay)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-overlay)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-medium)',
                    letterSpacing: 'var(--tracking-tight)',
                    padding: 'var(--space-3) var(--space-4)',
                    maxWidth: '400px',
                  },
                  success: { iconTheme: { primary: 'var(--success-fg)', secondary: 'var(--surface-overlay)' } },
                  error: { iconTheme: { primary: 'var(--error-fg)', secondary: 'var(--surface-overlay)' } },
                }}
              />
            </ErrorBoundary>
          </ResumeProvider>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
