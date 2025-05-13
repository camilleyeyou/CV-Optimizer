class SimpleAIService {
  // Generate professional summary
  async generateSummary(resumeData, jobTitle) {
    const skills = resumeData.skills.technical.slice(0, 3).join(', ');
    const position = jobTitle || resumeData.workExperience[0]?.position || 'Professional';
    const experience = this.calculateExperienceYears(resumeData);
    
    return `${position} with ${experience}+ years of experience in ${skills}. Proven track record of delivering high-quality solutions and leading successful projects. Passionate about creating efficient, scalable applications and mentoring team members.`;
  }

  // Enhance work experience descriptions
  async enhanceExperience(experience) {
    return [
      `Led development initiatives that improved system performance by 30%`,
      `Architected and implemented scalable solutions that enhanced user experience`,
      `Collaborated with cross-functional teams to deliver projects on time and within budget`,
      `Mentored junior developers and established best practices for code quality`
    ];
  }

  // Generate cover letter
  async generateCoverLetter(resume, jobDescription) {
    const name = `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`;
    const position = this.extractJobTitle(jobDescription) || "the position";
    
    return `Dear Hiring Manager,

I am writing to express my interest in ${position} as described in your job posting. With ${this.calculateExperienceYears(resume)}+ years of experience in software development and expertise in ${resume.skills.technical.slice(0, 3).join(', ')}, I am confident in my ability to make a significant contribution to your team.

Throughout my career at ${resume.workExperience[0]?.company}, I have successfully delivered projects that improved system performance and user experience. My experience aligns perfectly with the requirements outlined in your job description, particularly in areas of ${resume.skills.technical.slice(0, 3).join(', ')}.

I am excited about the opportunity to bring my technical expertise and leadership skills to your organization and help drive your company's success.

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience would be a good match for this position.

Sincerely,
${name}`;
  }

  // Suggest skills based on job description
  async suggestSkills(resume, jobDescription) {
    return {
      technical: ['Docker', 'Kubernetes', 'CI/CD', 'GraphQL', 'AWS Lambda'],
      soft: ['Strategic Planning', 'Cross-functional Collaboration', 'Stakeholder Management']
    };
  }

  // Improve achievement statements
  async improveAchievement(achievement, context) {
    const verbs = ['Spearheaded', 'Orchestrated', 'Implemented', 'Transformed', 'Accelerated'];
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    
    // Remove any existing beginning verb
    const cleanAchievement = achievement.replace(/^(led|developed|implemented|created|built|designed|managed|improved|increased|decreased|reduced|boosted|enhanced|streamlined|orchestrated|spearheaded)\s+/i, '');
    
    // Add metrics if none exist
    if (!cleanAchievement.match(/\d+%/) && !cleanAchievement.match(/\d+x/)) {
      return `${verb} ${cleanAchievement} resulting in 35% improvement in efficiency`;
    }
    
    return `${verb} ${cleanAchievement}`;
  }

  // Suggest action verbs
  async suggestActionVerbs(category) {
    const categories = {
      'leadership': ['Led', 'Managed', 'Directed', 'Oversaw', 'Guided', 'Mentored', 'Supervised', 'Coordinated', 'Spearheaded', 'Championed'],
      'development': ['Developed', 'Built', 'Created', 'Engineered', 'Constructed', 'Programmed', 'Designed', 'Architected', 'Implemented', 'Devised'],
      'improvement': ['Improved', 'Enhanced', 'Optimized', 'Streamlined', 'Upgraded', 'Refined', 'Revamped', 'Strengthened', 'Elevated', 'Boosted'],
      'achievement': ['Achieved', 'Attained', 'Delivered', 'Surpassed', 'Exceeded', 'Secured', 'Captured', 'Gained', 'Realized', 'Won'],
      'analysis': ['Analyzed', 'Evaluated', 'Assessed', 'Examined', 'Investigated', 'Researched', 'Studied', 'Diagnosed', 'Measured', 'Surveyed']
    };
    
    return categories[category?.toLowerCase()] || [
      'Spearheaded', 'Orchestrated', 'Implemented', 'Transformed', 'Developed',
      'Launched', 'Established', 'Executed', 'Pioneered', 'Revitalized'
    ];
  }

  // Helper methods
  calculateExperienceYears(resume) {
    if (!resume.workExperience || resume.workExperience.length === 0) {
      return 1;
    }

    // Sort experiences by start date
    const experiences = [...resume.workExperience].sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    );

    const firstStart = new Date(experiences[0].startDate);
    const lastEnd = experiences[experiences.length - 1].current ? 
      new Date() : new Date(experiences[experiences.length - 1].endDate);

    return Math.max(1, Math.round((lastEnd - firstStart) / (1000 * 60 * 60 * 24 * 365.25)));
  }
  
  extractJobTitle(jobDescription) {
    const commonTitles = ['Developer', 'Engineer', 'Manager', 'Specialist', 'Analyst', 'Designer', 'Architect'];
    
    for (const title of commonTitles) {
      if (jobDescription.includes(title)) {
        const words = jobDescription.split(/\s+/);
        const index = words.findIndex(word => word.includes(title));
        if (index > 0) {
          return words[index - 1] + ' ' + title;
        }
        return title;
      }
    }
    
    return 'the position';
  }
}

module.exports = new SimpleAIService();
