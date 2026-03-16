import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ResumeProvider } from './context/ResumeContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ErrorBoundary from './components/common/ErrorBoundary';
import PrivateRoute from './components/common/PrivateRoute';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import Templates from './pages/Templates';
import Login from './pages/Login';
import Register from './pages/Register';
import ATSChecker from './pages/ATSChecker';
import AICreator from './pages/AICreator';
import CoverLetter from './pages/CoverLetter';
import './styles.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ResumeProvider>
          <ErrorBoundary>
            <div className="app">
              <Header />
              <main className="main-content">
                <Routes>
                  {/* Public */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected */}
                  <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/templates" element={<PrivateRoute><Templates /></PrivateRoute>} />
                  <Route path="/builder" element={<PrivateRoute><Builder /></PrivateRoute>} />
                  <Route path="/builder/:id" element={<PrivateRoute><Builder /></PrivateRoute>} />
                  <Route path="/ats-checker" element={<PrivateRoute><ATSChecker /></PrivateRoute>} />
                  <Route path="/ai-creator" element={<PrivateRoute><AICreator /></PrivateRoute>} />
                  <Route path="/cover-letter" element={<PrivateRoute><CoverLetter /></PrivateRoute>} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
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
  );
}

export default App;
