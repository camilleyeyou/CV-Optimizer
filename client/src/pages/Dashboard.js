import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserResumes, deleteResume } from '../services/resumeService';
import { FaPlus, FaFileAlt, FaTrash, FaEdit, FaDownload, FaEye, FaClone } from 'react-icons/fa';

const Dashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Fetch user's resumes on component mount
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, we'd call getUserResumes() to get data from the API
        // For now, let's create some mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockResumes = [
          {
            _id: '1',
            name: 'Software Developer Resume',
            updatedAt: new Date().toISOString(),
            template: 'modern'
          },
          {
            _id: '2',
            name: 'Project Manager Resume',
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            template: 'professional'
          }
        ];
        
        setResumes(mockResumes);
      } catch (err) {
        console.error('Error fetching resumes:', err);
        setError('Failed to load your resumes. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // If user is not logged in, redirect to login
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchResumes();
    }
  }, [navigate]);
  
  // Handle resume deletion
  const handleDeleteResume = async (id, event) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        // In a real app, we'd call deleteResume(id)
        // For now, let's just update our state
        setResumes(prevResumes => prevResumes.filter(resume => resume._id !== id));
      } catch (err) {
        setError('Failed to delete resume. Please try again.');
        console.error('Error deleting resume:', err);
      }
    }
  };
  
  // Handle resume duplication
  const handleDuplicateResume = async (resume, event) => {
    event.stopPropagation();
    
    // Clone the resume data and modify name
    const duplicatedResume = {
      ...resume,
      _id: Date.now().toString(), // Generate a new ID
      name: `${resume.name} (Copy)`,
      updatedAt: new Date().toISOString()
    };
    
    // Add to resumes list
    setResumes(prevResumes => [...prevResumes, duplicatedResume]);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>My Resumes</h1>
        <Link to="/builder" className="btn btn-primary">
          <FaPlus /> Create New Resume
        </Link>
      </div>
      
      {error && (
        <div className="alert alert-danger">
          <p>{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your resumes...</p>
        </div>
      ) : (
        <div className="resumes-grid">
          {resumes.length === 0 ? (
            <div className="no-resumes">
              <FaFileAlt size={48} />
              <h2>No resumes yet</h2>
              <p>Create your first resume to get started</p>
              <Link to="/builder" className="btn btn-primary">
                <FaPlus /> Create Resume
              </Link>
            </div>
          ) : (
            resumes.map(resume => (
              <div 
                key={resume._id} 
                className="resume-card" 
                onClick={() => navigate(`/builder/${resume._id}`)}
              >
                <div className="resume-card-preview">
                  {/* Placeholder for resume thumbnail/preview */}
                  <div className="resume-preview-placeholder">
                    <FaFileAlt size={24} />
                  </div>
                </div>
                
                <div className="resume-card-footer">
                  <div className="resume-info">
                    <h3>{resume.name || 'Untitled Resume'}</h3>
                    <p>Last updated: {new Date(resume.updatedAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="resume-actions">
                    <button 
                      className="btn-icon" 
                      title="Edit Resume"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/builder/${resume._id}`);
                      }}
                    >
                      <FaEdit />
                    </button>
                    
                    <button 
                      className="btn-icon" 
                      title="Preview Resume"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/preview/${resume._id}`);
                      }}
                    >
                      <FaEye />
                    </button>
                    
                    <button 
                      className="btn-icon" 
                      title="Download PDF"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaDownload />
                    </button>
                    
                    <button 
                      className="btn-icon" 
                      title="Duplicate Resume"
                      onClick={(e) => handleDuplicateResume(resume, e)}
                    >
                      <FaClone />
                    </button>
                    
                    <button 
                      className="btn-icon btn-danger" 
                      title="Delete Resume"
                      onClick={(e) => handleDeleteResume(resume._id, e)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
