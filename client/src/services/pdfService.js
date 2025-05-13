import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

/**
 * Generate PDF from React component
 * @param {HTMLElement} element - The DOM element to convert
 * @param {Object} options - PDF options
 * @returns {Promise<Blob>} Promise with the PDF blob
 */
export const generatePDFFromElement = async (element, options = {}) => {
  const {
    filename = 'resume.pdf',
    format = 'a4',
    orientation = 'portrait',
    scale = 2,
    margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    }
  } = options;
  
  try {
    // Calculate PDF size (in mm)
    const formats = {
      a4: { width: 210, height: 297 },
      letter: { width: 215.9, height: 279.4 },
      legal: { width: 215.9, height: 355.6 }
    };
    
    let pdfWidth = formats[format].width;
    let pdfHeight = formats[format].height;
    
    if (orientation === 'landscape') {
      [pdfWidth, pdfHeight] = [pdfHeight, pdfWidth];
    }
    
    // Create canvas from element
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions preserving aspect ratio
    const imgWidth = pdfWidth - margin.left - margin.right;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF(orientation, 'mm', format);
    
    // If the content is longer than a single page, create multiple pages
    let heightLeft = imgHeight;
    let position = margin.top;
    
    // Add first page
    pdf.addImage(imgData, 'PNG', margin.left, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - margin.top - margin.bottom);
    
    // Add subsequent pages if needed
    while (heightLeft > 0) {
      position = margin.top - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin.left, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - margin.top - margin.bottom);
    }
    
    // Return PDF as blob
    const pdfBlob = pdf.output('blob');
    return pdfBlob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Download PDF from React component
 * @param {HTMLElement} element - The DOM element to convert
 * @param {Object} options - PDF options
 */
export const downloadPDF = async (element, options = {}) => {
  try {
    const pdfBlob = await generatePDFFromElement(element, options);
    saveAs(pdfBlob, options.filename || 'resume.pdf');
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};

/**
 * Generate PDF using backend service
 * @param {Object} resumeData - The resume data
 * @param {string} templateId - The template ID
 * @returns {Promise<Blob>} Promise with the PDF blob
 */
export const generatePDFFromServer = async (resumeData, templateId) => {
  try {
    // In a real app, you'd send a request to your backend
    // For now, simulate a backend response
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return a dummy PDF blob
    // In a real app, the backend would generate and return the actual PDF
    const dummyText = 'PDF Content Placeholder';
    const blob = new Blob([dummyText], { type: 'application/pdf' });
    return blob;
  } catch (error) {
    console.error('Error generating PDF from server:', error);
    throw error;
  }
};

/**
 * Download PDF from server
 * @param {Object} resumeData - The resume data
 * @param {string} templateId - The template ID
 * @param {string} filename - The filename
 */
export const downloadPDFFromServer = async (resumeData, templateId, filename = 'resume.pdf') => {
  try {
    const pdfBlob = await generatePDFFromServer(resumeData, templateId);
    saveAs(pdfBlob, filename);
  } catch (error) {
    console.error('Error downloading PDF from server:', error);
    throw error;
  }
};

export default {
  generatePDFFromElement,
  downloadPDF,
  generatePDFFromServer,
  downloadPDFFromServer
};
