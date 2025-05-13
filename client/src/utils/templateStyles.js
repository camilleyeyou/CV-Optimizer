/**
 * Add template-specific CSS styles to head
 * @param {string} templateId - The template ID
 */
export const loadTemplateStyles = (templateId) => {
  const styleId = `template-${templateId}-styles`;
  
  // Remove any existing template styles
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create new style element
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  
  // Add template-specific styles
  switch (templateId) {
    case 'modern':
      styleElement.textContent = getModernStyles();
      break;
    case 'professional':
      styleElement.textContent = getProfessionalStyles();
      break;
    case 'minimalist':
      styleElement.textContent = getMinimalistStyles();
      break;
    case 'creative':
      styleElement.textContent = getCreativeStyles();
      break;
    default:
      styleElement.textContent = getModernStyles();
  }
  
  // Append to head
  document.head.appendChild(styleElement);
};

/**
 * Remove template-specific CSS styles from head
 */
export const removeTemplateStyles = () => {
  const styleElements = document.querySelectorAll('[id^="template-"][id$="-styles"]');
  styleElements.forEach(element => element.remove());
};

/**
 * Get styles for Modern template
 */
const getModernStyles = () => `
  .modern-template {
    font-family: 'Raleway', sans-serif;
    color: #333;
    line-height: 1.6;
  }
  
  .modern-template .resume-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #4a6cf7;
  }
  
  .modern-template .name-title h1 {
    font-size: 36px;
    font-weight: 700;
    color: #333;
    margin-bottom: 5px;
  }
  
  .modern-template .name-title h2 {
    font-size: 20px;
    font-weight: 500;
    color: #4a6cf7;
  }
  
  .modern-template .contact-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: right;
  }
  
  .modern-template .contact-item {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    color: #555;
  }
  
  .modern-template .section-title {
    font-size: 22px;
    font-weight: 600;
    color: #4a6cf7;
    margin-bottom: 15px;
    padding-bottom: 5px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .modern-template .experience-item,
  .modern-template .education-item {
    margin-bottom: 25px;
  }
  
  .modern-template .job-title-company h4,
  .modern-template .degree-institution h4 {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 5px;
  }
  
  .modern-template .job-title-company h5,
  .modern-template .degree-institution h5 {
    font-size: 16px;
    font-weight: 500;
    color: #555;
  }
  
  .modern-template .description-list {
    margin-top: 10px;
    padding-left: 20px;
  }
  
  .modern-template .description-list li {
    margin-bottom: 5px;
    color: #555;
    position: relative;
  }
  
  .modern-template .description-list li::before {
    content: "•";
    position: absolute;
    left: -15px;
    color: #4a6cf7;
  }
  
  .modern-template .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .modern-template .skill-item {
    background-color: #f5f6fa;
    color: #555;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
    border: 1px solid #e0e0e0;
  }
`;

/**
 * Get styles for Professional template
 */
const getProfessionalStyles = () => `
  .professional-template {
    font-family: 'Source Sans Pro', sans-serif;
    color: #333;
    line-height: 1.5;
  }
  
  .professional-template .resume-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ddd;
  }
  
  .professional-template .name-title h1 {
    font-size: 28px;
    font-weight: 700;
    color: #2c3e50;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  
  .professional-template .name-title h2 {
    font-size: 18px;
    font-weight: 400;
    color: #555;
    margin-bottom: 15px;
  }
  
  .professional-template .contact-info {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .professional-template .contact-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #555;
    font-size: 14px;
  }
  
  .professional-template .resume-content {
    display: flex;
    gap: 30px;
  }
  
  .professional-template .resume-main {
    flex: 2;
  }
  
  .professional-template .resume-sidebar {
    flex: 1;
  }
  
  .professional-template .section-title {
    font-size: 20px;
    font-weight: 700;
    color: #2c3e50;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 2px solid #3498db;
  }
  
  /* Add more professional styles here */
`;

/**
 * Get styles for Minimalist template
 */
const getMinimalistStyles = () => `
  .minimalist-template {
    font-family: 'Inter', sans-serif;
    color: #333;
    line-height: 1.5;
    padding: 30px;
  }
  
  .minimalist-template .resume-header {
    margin-bottom: 30px;
  }
  
  .minimalist-template .name {
    font-size: 28px;
    font-weight: 700;
    color: #000;
    margin-bottom: 5px;
    letter-spacing: -0.5px;
  }
  
  .minimalist-template .title {
    font-size: 16px;
    font-weight: 400;
    color: #555;
    margin-bottom: 15px;
  }
  
  /* Add more minimalist styles here */
`;

/**
 * Get styles for Creative template
 */
const getCreativeStyles = () => `
  .creative-template {
    font-family: 'Poppins', sans-serif;
    color: #333;
    line-height: 1.5;
    display: flex;
    min-height: 100%;
  }
  
  .creative-template .resume-sidebar {
    width: 30%;
    background-color: #2c3e50;
    color: white;
    padding: 30px;
  }
  
  .creative-template .resume-main {
    width: 70%;
    padding: 30px;
  }
  
  /* Add more creative styles here */
`;

export default {
  loadTemplateStyles,
  removeTemplateStyles
};
