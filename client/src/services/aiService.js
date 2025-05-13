import axios from 'axios';

// Base API URL (should be environment variable in production)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Get AI suggestions based on type and context
 * @param {string} type - The type of suggestion (summary, workBullets, skills)
 * @param {Object} context - Context data for the suggestion
 * @returns {Promise} Promise with the suggestions
 */
export const getAiSuggestions = async (type, context) => {
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock responses based on type
    switch (type) {
      case 'summary':
        return [
          "Dedicated software engineer with 5+ years of experience in full-stack development. Proficient in JavaScript, React, and Node.js, with a strong background in building scalable web applications. Passionate about creating intuitive user experiences and implementing efficient backend solutions.",
          "Results-driven software developer with expertise in modern web technologies and a track record of delivering high-quality applications. Strong problem-solving abilities and experience collaborating in Agile teams. Committed to continuous learning and staying updated with the latest industry trends."
        ];
      
      case 'workBullets':
        return [
          "Developed and maintained multiple RESTful APIs using Node.js and Express, improving system performance by 30%\n• Implemented responsive UI components with React, reducing page load time by 25%\n• Collaborated with cross-functional teams to deliver projects on time and within budget\n• Conducted code reviews and mentored junior developers to ensure code quality",
          "Led the migration of legacy systems to modern web technologies, resulting in 40% faster development cycles\n• Optimized database queries and implemented caching strategies, enhancing application response time by 35%\n• Created comprehensive test suites using Jest and Cypress, achieving 90% code coverage\n• Participated in Agile ceremonies and contributed to product roadmap discussions"
        ];
      
      case 'skills':
        return [
          "JavaScript",
          "React",
          "Node.js",
          "TypeScript",
          "Express",
          "MongoDB",
          "RESTful APIs",
          "Git",
          "Agile Methodology",
          "CI/CD",
          "Jest",
          "Webpack"
        ];
      
      default:
        return [];
    }
  } catch (error) {
    console.error(`Error getting ${type} suggestions:`, error);
    throw error;
  }
};

/**
 * Generate action verbs for work descriptions
 * @param {string} role - The job role or industry
 * @returns {Promise} Promise with action verbs
 */
export const getActionVerbs = async (role) => {
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock response
    return [
      "Developed",
      "Implemented",
      "Created",
      "Designed",
      "Managed",
      "Led",
      "Optimized",
      "Improved",
      "Streamlined",
      "Coordinated",
      "Achieved",
      "Delivered"
    ];
  } catch (error) {
    console.error('Error getting action verbs:', error);
    throw error;
  }
};

/**
 * Generate keywords from job description
 * @param {string} jobDescription - The job description text
 * @returns {Promise} Promise with keywords
 */
export const extractKeywords = async (jobDescription) => {
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response - would be based on job description in real implementation
    return [
      { keyword: "React", relevance: "high" },
      { keyword: "JavaScript", relevance: "high" },
      { keyword: "Node.js", relevance: "medium" },
      { keyword: "TypeScript", relevance: "high" },
      { keyword: "API development", relevance: "medium" },
      { keyword: "Agile", relevance: "medium" },
      { keyword: "Unit testing", relevance: "medium" },
      { keyword: "CI/CD", relevance: "low" }
    ];
  } catch (error) {
    console.error('Error extracting keywords:', error);
    throw error;
  }
};

/**
 * Generate cover letter based on resume and job description
 * @param {Object} resumeData - The resume data
 * @param {string} jobDescription - The job description
 * @param {Object} options - Additional options
 * @returns {Promise} Promise with cover letter text
 */
export const generateCoverLetter = async (resumeData, jobDescription, options = {}) => {
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock response
    const { firstName, lastName } = resumeData.personalInfo;
    const { companyName, jobTitle, hiringManager } = options;
    
    const salutation = hiringManager 
      ? `Dear ${hiringManager},` 
      : 'Dear Hiring Manager,';
    
    const coverLetter = `${salutation}

I am writing to express my interest in the ${jobTitle} position at ${companyName}. With my background in software development and experience with modern web technologies, I believe I am well-suited for this role.

Throughout my career, I have focused on developing scalable web applications using JavaScript, React, and Node.js. My experience aligns well with the requirements outlined in your job posting, particularly in areas of front-end development and API integration.

In my previous role at XYZ Company, I successfully led the development of a customer-facing application that improved user engagement by 40%. I collaborated closely with design and product teams to ensure the application met both user needs and business requirements.

I am particularly excited about joining ${companyName} because of your innovative approach to technology solutions and your commitment to user experience. I am confident that my skills and passion for creating efficient, user-friendly applications would make me a valuable addition to your team.

Thank you for considering my application. I look forward to the opportunity to discuss how my experience and skills align with your needs.

Sincerely,
${firstName} ${lastName}`;

    return { coverLetter };
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw error;
  }
};

/**
 * Improve text based on ATS optimization
 * @param {string} text - The text to improve
 * @param {string} type - The type of text (summary, bullet, etc.)
 * @param {Array} keywords - Optional keywords to include
 * @returns {Promise} Promise with improved text
 */
export const improveText = async (text, type, keywords = []) => {
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Mock response - in a real implementation, this would analyze and improve the text
    return {
      improvedText: text + " (Improved with keywords: " + keywords.join(", ") + ")",
      changes: [
        {
          original: "Created web applications",
          improved: "Developed responsive web applications using React and Node.js"
        },
        {
          original: "Worked on team projects",
          improved: "Collaborated in Agile teams to deliver projects on schedule"
        }
      ]
    };
  } catch (error) {
    console.error('Error improving text:', error);
    throw error;
  }
};

export default {
  getAiSuggestions,
  getActionVerbs,
  extractKeywords,
  generateCoverLetter,
  improveText,
};
