import React, { useState } from 'react';
import { useResume } from '../context/ResumeContext';
import * as resumeService from '../services/resumeService';

const TestPdf = () => {
  const { resumeData, activeTemplate, generatePDF } = useResume();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  
  const testResumeIdDownload = async () => {
    setStatus('Testing PDF download using resumeId...');
    try {
      // Check if we have a resumeId
      if (!resumeData._id) {
        throw new Error('No resume ID found. Please load or save a resume first.');
      }
      
      setStatus(`Sending request with resumeId: ${resumeData._id}`);
      
      // Use the service function which will send only the resumeId
      const pdfBlob = await resumeService.generatePDF(resumeData, activeTemplate);
      
      setStatus('PDF data received, initiating download...');
      
      // Create a download link
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personalInfo?.firstName || 'resume'}-${resumeData.personalInfo?.lastName || ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setStatus('Download initiated successfully!');
    } catch (err) {
      console.error('PDF download failed:', err);
      setError(err.message || 'Unknown error occurred');
      setStatus('Failed');
    }
  };
  
  const testContextMethod = async () => {
    setStatus('Testing PDF generation through context...');
    try {
      // This will use the implementation in ResumeContext
      await generatePDF();
      setStatus('Context method completed');
    } catch (err) {
      console.error('Context PDF download failed:', err);
      setError(err.message || 'Unknown error occurred');
      setStatus('Failed');
    }
  };
  
  return (
    <div className="test-pdf-page" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>PDF Generation Test</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Status:</h3>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '3px', overflowX: 'auto' }}>{status}</pre>
        {error && <div style={{ color: 'red', padding: '10px', backgroundColor: '#fff0f0', borderRadius: '3px' }}>{error}</div>}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={testResumeIdDownload}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Download PDF (Service Method)
        </button>
        
        <button 
          onClick={testContextMethod}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Download PDF (Context Method)
        </button>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h3>Debug Info:</h3>
        <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '3px' }}>
          <p><strong>Resume ID:</strong> {resumeData._id || 'Not set (resume not saved)'}</p>
          <p><strong>Template:</strong> {activeTemplate || 'Not set'}</p>
          <p><strong>Resume Name:</strong> {resumeData?.personalInfo?.firstName || 'Not set'} {resumeData?.personalInfo?.lastName || ''}</p>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
        <h3>Important Note:</h3>
        <ul>
          <li><strong>You must save your resume first!</strong> A resume ID is required for PDF generation</li>
          <li>If you haven't saved your resume yet, go back to the builder and save it</li>
          <li>Make sure you're logged in, as authentication is required for PDF generation</li>
        </ul>
      </div>
    </div>
  );
};

export default TestPdf;
