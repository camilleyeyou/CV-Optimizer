// src/utils/pdfGenerator.js

export const generateResumePDF = async (resumeData) => {
  try {
    // First try to find the preview element
    let element = document.querySelector('.preview-document');
    
    if (!element) {
      // If preview element not found, create a temporary hidden preview
      element = await createTemporaryPreview(resumeData);
    }

    if (!element) {
      throw new Error('Unable to create resume preview for PDF generation');
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups.');
    }

    // Get the HTML content
    const htmlContent = element.innerHTML;
    
    // Get current page styles
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          // Handle cross-origin stylesheets
          return '';
        }
      })
      .join('\n');

    // Create the print document
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resumeData.personalInfo?.firstName || 'Resume'} ${resumeData.personalInfo?.lastName || ''}</title>
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              background: white;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
            ${styles}
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `;

    // Write the document and close it
    printWindow.document.write(printDocument);
    printWindow.document.close();
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Helper function to create temporary preview
const createTemporaryPreview = async (resumeData) => {
  try {
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.className = 'preview-document';
    
    // Create a simple resume template
    const resumeHTML = `
      <div style="padding: 40px; font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px;">
        <header style="border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 2.5em; color: #333;">
            ${resumeData.personalInfo?.firstName || ''} ${resumeData.personalInfo?.lastName || ''}
          </h1>
          <div style="margin-top: 10px; font-size: 1.1em; color: #666;">
            ${resumeData.personalInfo?.email || ''} | ${resumeData.personalInfo?.phone || ''}
          </div>
          <div style="margin-top: 5px; color: #666;">
            ${resumeData.personalInfo?.address || ''} ${resumeData.personalInfo?.city || ''} ${resumeData.personalInfo?.state || ''}
          </div>
        </header>
        
        ${resumeData.summary ? `
          <section style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Professional Summary</h2>
            <p style="margin-top: 15px;">${resumeData.summary}</p>
          </section>
        ` : ''}
        
        ${resumeData.workExperience && resumeData.workExperience.length > 0 ? `
          <section style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Work Experience</h2>
            ${resumeData.workExperience.map(job => `
              <div style="margin-top: 20px;">
                <h3 style="margin: 0; color: #444;">${job.jobTitle || ''} - ${job.company || ''}</h3>
                <p style="margin: 5px 0; color: #666; font-style: italic;">
                  ${job.startDate || ''} - ${job.endDate || 'Present'}
                </p>
                <p style="margin-top: 10px;">${job.description || ''}</p>
              </div>
            `).join('')}
          </section>
        ` : ''}
        
        ${resumeData.education && resumeData.education.length > 0 ? `
          <section style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Education</h2>
            ${resumeData.education.map(edu => `
              <div style="margin-top: 15px;">
                <h3 style="margin: 0; color: #444;">${edu.degree || ''}</h3>
                <p style="margin: 5px 0; color: #666;">${edu.school || ''}</p>
                <p style="margin: 5px 0; color: #666; font-style: italic;">${edu.graduationDate || ''}</p>
              </div>
            `).join('')}
          </section>
        ` : ''}
        
        ${resumeData.skills && resumeData.skills.length > 0 ? `
          <section style="margin-bottom: 30px;">
            <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Skills</h2>
            <p style="margin-top: 15px;">${resumeData.skills.join(', ')}</p>
          </section>
        ` : ''}
        
        ${resumeData.certifications && resumeData.certifications.length > 0 ? `
          <section>
            <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px;">Certifications</h2>
            ${resumeData.certifications.map(cert => `
              <div style="margin-top: 15px;">
                <h3 style="margin: 0; color: #444;">${cert.name || ''}</h3>
                <p style="margin: 5px 0; color: #666;">${cert.issuer || ''} - ${cert.date || ''}</p>
              </div>
            `).join('')}
          </section>
        ` : ''}
      </div>
    `;
    
    tempContainer.innerHTML = resumeHTML;
    document.body.appendChild(tempContainer);
    
    // Return the temporary element
    return tempContainer;
  } catch (error) {
    console.error('Error creating temporary preview:', error);
    return null;
  }
};

// Alternative method using HTML5 download (creates HTML file)
export const downloadResumeHTML = (resumeData) => {
  try {
    const element = document.querySelector('.preview-document');
    
    if (!element) {
      throw new Error('Resume preview element not found');
    }

    const htmlContent = element.innerHTML;
    
    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resumeData.personalInfo?.firstName || 'Resume'} ${resumeData.personalInfo?.lastName || ''}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: white;
            }
            .resume-preview {
              max-width: 800px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="resume-preview">
            ${htmlContent}
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resumeData.personalInfo?.firstName || 'Resume'}_${resumeData.personalInfo?.lastName || ''}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading HTML:', error);
    throw error;
  }
};