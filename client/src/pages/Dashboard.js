import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { resumeList, fetchResumes, deleteResume, isLoading } = useResume();
  const auth = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [resumeStats, setResumeStats] = useState({
    total: 0,
    recent: 0,
    downloaded: 0
  });
  
  // 🔧 CRITICAL FIX: Prevent multiple fetch calls
  const hasFetchedRef = useRef(false);
  const isInitializedRef = useRef(false);

  const isUserAuthenticated = () => {
    if (!auth) return false;
    const { isAuthenticated } = auth;
    return typeof isAuthenticated === 'function' 
      ? isAuthenticated() 
      : isAuthenticated;
  };

  // 🔧 STABLE: Create stable function references to avoid dependency issues
  const stableFetchResumes = useCallback(() => {
    return fetchResumes();
  }, [fetchResumes]);

  const stableIsUserAuthenticated = useCallback(() => {
    if (!auth) return false;
    const { isAuthenticated } = auth;
    return typeof isAuthenticated === 'function' 
      ? isAuthenticated() 
      : isAuthenticated;
  }, [auth]);

  // 🔧 MAJOR FIX: Stable initialization with proper dependencies
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }

    const userAuthenticated = stableIsUserAuthenticated();
    
    if (!userAuthenticated) {
      console.log('Dashboard: User not authenticated, skipping initialization');
      return;
    }

    console.log('Dashboard: Initializing for authenticated user');
    isInitializedRef.current = true;
    
    // Tutorial logic
    const isFirstVisit = localStorage.getItem('firstVisit') !== 'false';
    if (isFirstVisit) {
      setShowTutorial(true);
      localStorage.setItem('firstVisit', 'false');
    }
    
    // Fetch resumes only once
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      console.log('Dashboard: Fetching resumes...');
      
      // Small delay to ensure context is ready
      setTimeout(() => {
        try {
          stableFetchResumes();
        } catch (error) {
          console.error('Dashboard: Error fetching resumes:', error);
          hasFetchedRef.current = false; // Allow retry on error
        }
      }, 100);
    }
  }, [stableFetchResumes, stableIsUserAuthenticated]); // Proper dependencies

  // 🔧 SAFER: Calculate stats only when resumeList actually changes
  useEffect(() => {
    if (!resumeList || !Array.isArray(resumeList)) {
      setResumeStats({ total: 0, recent: 0, downloaded: 0 });
      return;
    }
    
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const stats = {
        total: resumeList.length,
        recent: resumeList.filter(resume => {
          try {
            return new Date(resume.updatedAt) > thirtyDaysAgo;
          } catch (e) {
            return false;
          }
        }).length,
        downloaded: resumeList.filter(resume => (resume.downloads || 0) > 0).length
      };
      
      setResumeStats(stats);
      console.log('Dashboard: Stats updated:', stats);
    } catch (error) {
      console.error('Error calculating resume stats:', error);
      setResumeStats({ total: 0, recent: 0, downloaded: 0 });
    }
  }, [resumeList]); // Only depend on resumeList

  const handleCreateNew = () => {
    navigate('/templates');
  };

  const handleEditResume = (id) => {
    navigate(`/builder/${id}`);
  };

  const handleDeleteResume = async (id, event) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        console.log('Dashboard: Deleting resume:', id);
        const success = await deleteResume(id);
        if (success) {
          console.log('Dashboard: Resume deleted successfully:', id);
        } else {
          alert('Failed to delete resume. Please try again.');
        }
      } catch (error) {
        console.error('Dashboard: Error deleting resume:', error);
        alert('Failed to delete resume. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getTemplateColor = (template) => {
    const colors = {
      modern: '#6366f1',
      creative: '#f59e0b',
      professional: '#374151',
      classic: '#8b5cf6',
      minimal: '#10b981',
      technical: '#ef4444'
    };
    return colors[template] || colors.modern;
  };

  // 🔧 CLEANER: Early return for unauthenticated users
  if (!stableIsUserAuthenticated()) {
    console.log('Dashboard: User not authenticated, returning null');
    return null;
  }

  return (
    <div className="dashboard">
      {showTutorial && (
        <div className="tutorial-overlay">
          <div className="tutorial-modal">
            <div className="tutorial-icon">🎉</div>
            <h2>Welcome to CV Optimizer!</h2>
            <p>Ready to create amazing resumes that get you hired?</p>
            <button className="tutorial-btn" onClick={() => setShowTutorial(false)}>
              Let's Go!
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1>Your Resume Dashboard</h1>
          <p>Create, edit, and manage your professional resumes</p>
        </div>
        <button className="btn-primary" onClick={handleCreateNew}>
          <span className="btn-icon">✨</span>
          Create New Resume
        </button>
      </div>
      
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-icon blue">📄</div>
          <div className="stat-info">
            <div className="stat-number">{resumeStats.total}</div>
            <div className="stat-label">Total Resumes</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon green">🔄</div>
          <div className="stat-info">
            <div className="stat-number">{resumeStats.recent}</div>
            <div className="stat-label">Recent Updates</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon purple">📥</div>
          <div className="stat-info">
            <div className="stat-number">{resumeStats.downloaded}</div>
            <div className="stat-label">Downloads</div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="dashboard-grid">
        {/* Resumes Section */}
        <div className="resumes-panel">
          <div className="panel-header">
            <h2>Your Resumes ({resumeList?.length || 0})</h2>
          </div>
          
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your resumes...</p>
            </div>
          ) : resumeList && Array.isArray(resumeList) && resumeList.length > 0 ? (
            <div className="resume-grid">
              {resumeList.map((resume) => (
                <div key={resume.id} className="resume-card">
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="resume-title">
                      <h3>{resume.title}</h3>
                      <span 
                        className="template-tag"
                        style={{ backgroundColor: getTemplateColor(resume.template) }}
                      >
                        {resume.template || 'modern'}
                      </span>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="action-btn edit"
                        onClick={() => handleEditResume(resume.id)}
                        title="Edit resume"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={(e) => handleDeleteResume(resume.id, e)}
                        title="Delete resume"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {/* Mini Preview */}
                  <div 
                    className="resume-preview-mini"
                    style={{ borderTopColor: getTemplateColor(resume.template) }}
                  >
                    <div className="preview-content">
                      <div className="preview-name">
                        {resume.personalInfo?.firstName || ''} {resume.personalInfo?.lastName || ''}
                      </div>
                      <div className="preview-contact">
                        {resume.personalInfo?.email && (
                          <div className="preview-email">{resume.personalInfo.email}</div>
                        )}
                      </div>
                      {resume.summary && (
                        <div className="preview-section">
                          <div className="preview-title">SUMMARY</div>
                          <div className="preview-text">{resume.summary.substring(0, 80)}...</div>
                        </div>
                      )}
                      {resume.workExperience && resume.workExperience.length > 0 && (
                        <div className="preview-section">
                          <div className="preview-title">EXPERIENCE</div>
                          <div className="preview-job">
                            <div className="job-title">{resume.workExperience[0].jobTitle}</div>
                            <div className="job-company">{resume.workExperience[0].company}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Card Footer */}
                  <div className="card-footer">
                    <div className="resume-meta">
                      <span className="meta-item">
                        📅 {formatDate(resume.updatedAt)}
                      </span>
                      <span className="meta-item">
                        📥 {resume.downloads || 0} downloads
                      </span>
                    </div>
                    <button 
                      className="btn-edit-full"
                      onClick={() => handleEditResume(resume.id)}
                    >
                      Edit Resume
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Add New Card */}
              <div className="resume-card add-card" onClick={handleCreateNew}>
                <div className="add-content">
                  <div className="add-icon">+</div>
                  <h3>Create New Resume</h3>
                  <p>Start building your next opportunity</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🚀</div>
              <h3>Ready to Get Started?</h3>
              <p>Create your first professional resume and land your dream job!</p>
              <button className="btn-primary large" onClick={handleCreateNew}>
                <span className="btn-icon">✨</span>
                Create Your First Resume
              </button>
            </div>
          )}
        </div>
        
        {/* Tips Sidebar */}
        <div className="tips-panel">
          <h2>💡 Pro Tips</h2>
          
          <div className="tip-card featured">
            <div className="tip-header">
              <span className="tip-emoji">🎯</span>
              <h3>ATS Optimization</h3>
            </div>
            <ul className="tip-list">
              <li>Use relevant keywords from job descriptions</li>
              <li>Keep formatting simple and clean</li>
              <li>Include quantifiable achievements</li>
            </ul>
          </div>
          
          <div className="tip-card">
            <div className="tip-header">
              <span className="tip-emoji">✨</span>
              <h3>Stand Out</h3>
            </div>
            <ul className="tip-list">
              <li>Tailor each resume to the specific role</li>
              <li>Highlight your most relevant experience</li>
              <li>Use action verbs and strong language</li>
            </ul>
          </div>
          
          <div className="tip-card">
            <div className="tip-header">
              <span className="tip-emoji">❌</span>
              <h3>Avoid These Mistakes</h3>
            </div>
            <ul className="tip-list">
              <li>Spelling and grammar errors</li>
              <li>Unprofessional email addresses</li>
              <li>Including irrelevant information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;