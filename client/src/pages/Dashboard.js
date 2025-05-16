import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import OnboardingTutorial from '../components/tutorial/OnboardingTutorial';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { resumeList, fetchResumes, deleteResume, isLoading } = useResume();
  const [showTutorial, setShowTutorial] = useState(false);
  const [resumeStats, setResumeStats] = useState({
    total: 0,
    recent: 0,
    downloaded: 0
  });

  useEffect(() => {
    fetchResumes();
    // Check if it's the user's first visit
    const isFirstVisit = localStorage.getItem('firstVisit') !== 'false';
    if (isFirstVisit) {
      setShowTutorial(true);
      localStorage.setItem('firstVisit', 'false');
    }
    
    // Calculate resume stats
    if (resumeList && Array.isArray(resumeList)) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      setResumeStats({
        total: resumeList.length,
        recent: resumeList.filter(resume => new Date(resume.updatedAt) > thirtyDaysAgo).length,
        downloaded: resumeList.filter(resume => resume.downloads > 0).length
      });
    } else {
      console.log('Resume list is not an array:', resumeList);
    }
  }, [fetchResumes, resumeList]);

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
        await deleteResume(id);
      } catch (error) {
        console.error('Error deleting resume:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="dashboard-page">
      {showTutorial && <OnboardingTutorial onComplete={() => setShowTutorial(false)} />}
      
      <div className="dashboard-header">
        <h1>Your Resume Dashboard</h1>
        <button className="create-button" onClick={handleCreateNew}>
          Create New Resume
        </button>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{resumeStats.total}</div>
          <div className="stat-label">Total Resumes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{resumeStats.recent}</div>
          <div className="stat-label">Updated Recently</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{resumeStats.downloaded}</div>
          <div className="stat-label">Downloaded</div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="resumes-section">
          <h2>Your Resumes</h2>
          
          {isLoading ? (
            <div className="loading-indicator">Loading your resumes...</div>
          ) : resumeList && Array.isArray(resumeList) && resumeList.length > 0 ? (
            <div className="resumes-grid">
              {resumeList.map((resume) => (
                <div 
                  key={resume._id} 
                  className="resume-card"
                  onClick={() => handleEditResume(resume._id)}
                >
                  <div className="resume-preview">
                    <img 
                      src={`/templates/${resume.template || 'modern'}.png`} 
                      alt={`${resume.title} preview`} 
                    />
                  </div>
                  <div className="resume-info">
                    <h3>{resume.title}</h3>
                    <div className="resume-meta">
                      <span className="template-badge">{resume.template || 'modern'}</span>
                      <span className="date-info">Updated: {formatDate(resume.updatedAt)}</span>
                    </div>
                    <div className="resume-actions">
                      <button 
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditResume(resume._id);
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={(e) => handleDeleteResume(resume._id, e)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="resume-card add-new" onClick={handleCreateNew}>
                <div className="add-icon">+</div>
                <p>Create New Resume</p>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>No Resumes Yet</h3>
              <p>Create your first resume to get started</p>
              <button className="create-button" onClick={handleCreateNew}>
                Create New Resume
              </button>
            </div>
          )}
        </div>
        
        <div className="tips-section">
          <h2>Resume Tips</h2>
          <div className="tips-card">
            <h3>ATS Optimization</h3>
            <ul>
              <li>Use keywords from the job description</li>
              <li>Avoid tables, images, and fancy formatting</li>
              <li>Use standard section headings</li>
              <li>Include measurable achievements</li>
            </ul>
          </div>
          <div className="tips-card">
            <h3>Tailoring Your Resume</h3>
            <ul>
              <li>Customize each resume for the specific job</li>
              <li>Highlight relevant experience and skills</li>
              <li>Use industry-specific terminology</li>
              <li>Focus on achievements, not just responsibilities</li>
            </ul>
          </div>
          <div className="tips-card">
            <h3>Resume Mistakes to Avoid</h3>
            <ul>
              <li>Typos and grammatical errors</li>
              <li>Including irrelevant information</li>
              <li>Being too generic</li>
              <li>Using an unprofessional email address</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
