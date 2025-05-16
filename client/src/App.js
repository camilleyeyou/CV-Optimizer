import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ResumeProvider } from './context/ResumeContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import Templates from './pages/Templates';
import Login from './pages/Login';
import Register from './pages/Register';
import CoverLetterPage from './pages/CoverLetterPage';
import PrivateRoute from './components/common/PrivateRoute';
import './styles.css';

function App() {
  return (
    <ResumeProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/templates" element={<Templates />} />
              <Route 
                path="/builder" 
                element={
                  <PrivateRoute>
                    <Builder />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/builder/:id" 
                element={
                  <PrivateRoute>
                    <Builder />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/cover-letter" 
                element={
                  <PrivateRoute>
                    <CoverLetterPage />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ResumeProvider>
  );
}

export default App;