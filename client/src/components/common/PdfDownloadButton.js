import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';

const PdfDownloadButton = () => {
  const { generatePDF, isLoading, error } = useResume();
  const [downloadStatus, setDownloadStatus] = useState('');

  const handleDownload = async () => {
    setDownloadStatus('starting');
    try {
      console.log('Starting PDF download process');
      await generatePDF();
      setDownloadStatus('success');
    } catch (err) {
      console.error('PDF download failed:', err);
      setDownloadStatus('error');
    }
  };

  return (
    <div className="pdf-download-container">
      <button 
        className="pdf-download-button" 
        onClick={handleDownload}
        disabled={isLoading}
      >
        {isLoading ? 'Generating PDF...' : 'Download Resume as PDF'}
      </button>
      
      {downloadStatus === 'success' && !error && (
        <div className="download-status success">
          PDF download initiated successfully!
        </div>
      )}
      
      {downloadStatus === 'error' || error ? (
        <div className="download-status error">
          Error: {error || 'Failed to generate PDF'}
        </div>
      ) : null}
      
      <div className="troubleshooting-info">
        <p>If the PDF doesn't download automatically:</p>
        <ol>
          <li>Check if your browser is blocking pop-ups</li>
          <li>Make sure you have a PDF viewer installed</li>
          <li>Try using a different browser</li>
        </ol>
      </div>
    </div>
  );
};

export default PdfDownloadButton;
