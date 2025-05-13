class BasicAIService {
  // Generate professional summary
  async generateSummary(resumeData, jobTitle) {
    try {
      const position = jobTitle || resumeData.workExperience[0]?.position || 'Professional';
      const skills = resumeData.skills.technical.slice(0, 3).join(', ');
      const experience = this.calculateExperienceYears(resumeData);
      
      return `${position} with ${experience}+ years of experience in ${skills}. Proven track record of delivering high-quality solutions and leading successful projects. Passionate about creating efficient, scalable applications and mentoring team members.`;
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Experienced professional with a strong background in software development.';
    }
  }

  // Enhance work experience descriptions
  async enhanceExperience(experience) {
    try {
      const roleType = this.getRoleType(experience.position);
      
      if (roleType === 'leadership') {
        return [
          `Led cross-functional teams to deliver projects on time and within budget`,
          `Orchestrated the implementation of new technologies that improved system performance by 30%`,
          `Mentored junior developers and established coding standards and best practices`,
          `Spearheaded the migration to a microservices architecture that enhanced system scalability`
        ];
      } else if (roleType === 'development') {
        return [
          `Developed robust features that improved user experience and application functionality`,
          `Implemented efficient algorithms that reduced processing time by 40%`,
          `Collaborated with team members to resolve complex technical challenges`,
          `Created comprehensive test suites that increased code coverage by 70%`
        ];
      } else {
        return [
          `Managed key responsibilities with exceptional attention to detail and quality`,
          `Implemented process improvements that increased team productivity by 25%`,
          `Collaborated with stakeholders to ensure project requirements were met`,
          `Delivered high-quality results consistently ahead of deadlines`
        ];
      }
    } catch (error) {
      console.error('Error enhancing experience:', error);
      return [
        'Led development initiatives with successful outcomes',
        'Implemented technical solutions to business problems',
        'Collaborated with team members on various projects',
        'Delivered high-quality work within established timelines'
      ];
    }
  }

  // Generate cover letter
  async generateCoverLetter(resume, jobDescription) {
    try {
      const name = `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`;
      const position = this.extractJobTitle(jobDescription) || "the position";
      const skills = resume.skills.technical.slice(0, 3).join(', ');
      const experience = this.calculateExperienceYears(resume);
      
      return `Dear Hiring Manager,

I am writing to express my interest in ${position} as described in your job posting. With ${experience}+ years of experience in software development and expertise in ${skills}, I am confident in my ability to make a significant contribution to your team.

Throughout my career at ${resume.workExperience[0]?.company}, I have successfully delivered projects that improved system performance and user experience. My experience aligns perfectly with the requirements outlined in your job description, particularly in areas of ${skills}.

I am excited about the opportunity to bring my technical expertise and leadership skills to your organization and help drive your company's success.

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience would be a good match for this position.

Sincerely,
${name}`;
    } catch (error) {
      console.error('Error generating cover letter:', error);
      return 'Error generating cover letter. Please try again.';
    }
  }

  // Suggest skills based on job description
  async suggestSkills(resume, jobDescription) {
    try {
      const jobDescLower = jobDescription.toLowerCase();
      const currentSkills = [...resume.skills.technical, ...resume.skills.soft].map(s => s.toLowerCase());
      
      const technical = [];
      const soft = [];
      
      // Check for technical skills in job description
      const techSkills = [
        'Docker', 'Kubernetes', 'CI/CD', 'GraphQL', 'AWS Lambda', 'Terraform',
        'Redux', 'Vue.js', 'Angular', 'Django', 'Flask', 'Spring Boot',
        'Microservices', 'RESTful APIs', 'NoSQL', 'Elasticsearch'
      ];
      
      // Check for soft skills in job description
      const softSkills = [
        'Strategic Planning', 'Cross-functional Collaboration', 'Stakeholder Management',
        'Critical Thinking', 'Problem Solving', 'Time Management', 'Negotiation',
        'Public Speaking', 'Conflict Resolution', 'Emotional Intelligence'
      ];
      
      // Find skills mentioned in job description that aren't in resume
      techSkills.forEach(skill => {
        if (jobDescLower.includes(skill.toLowerCase()) && 
            !currentSkills.some(cs => cs.includes(skill.toLowerCase()))) {
          technical.push(skill);
        }
      });
      
      softSkills.forEach(skill => {
        if (jobDescLower.includes(skill.toLowerCase()) && 
            !currentSkills.some(cs => cs.includes(skill.toLowerCase()))) {
          soft.push(skill);
        }
      });
      
      // If no matches, add some generic suggestions
      if (technical.length === 0) {
        technical.push('Docker', 'Kubernetes', 'CI/CD');
      }
      
      if (soft.length === 0) {
        soft.push('Strategic Planning', 'Cross-functional Collaboration');
      }
      
      return { technical, soft };
    } catch (error) {
      console.error('Error suggesting skills:', error);
      return {
        technical: ['Docker', 'Kubernetes', 'CI/CD'],
        soft: ['Strategic Planning', 'Cross-functional Collaboration']
      };
    }
  }

  // Improve achievement statements
  async improveAchievement(achievement, context) {
    try {
      // Get a verb based on context or random if no context
      let verb;
      if (context) {
        if (context.toLowerCase().includes('lead') || context.toLowerCase().includes('manage')) {
          verb = this.getRandomItem(['Spearheaded', 'Orchestrated', 'Led', 'Directed', 'Oversaw']);
        } else if (context.toLowerCase().includes('develop') || context.toLowerCase().includes('code')) {
          verb = this.getRandomItem(['Developed', 'Engineered', 'Implemented', 'Architected', 'Built']);
        } else if (context.toLowerCase().includes('improve') || context.toLowerCase().includes('enhance')) {
          verb = this.getRandomItem(['Improved', 'Enhanced', 'Optimized', 'Streamlined', 'Transformed']);
        } else {
          verb = this.getRandomItem(['Spearheaded', 'Implemented', 'Delivered', 'Executed', 'Achieved']);
        }
      } else {
        verb = this.getRandomItem(['Spearheaded', 'Implemented', 'Delivered', 'Orchestrated', 'Transformed']);
      }
      
      // Remove any existing beginning verb
      const cleanAchievement = achievement.replace(/^(led|developed|implemented|created|built|designed|managed|improved|increased|decreased|reduced|boosted|enhanced|streamlined|orchestrated|spearheaded)\s+/i, '');
      
      // Add metrics if none exist
      if (!cleanAchievement.match(/\d+%/) && !cleanAchievement.match(/\d+x/) && !cleanAchievement.match(/\d+ times/)) {
        const percentage = Math.floor(Math.random() * 40) + 20; // Random number between 20-60
        return `${verb} ${cleanAchievement} resulting in ${percentage}% improvement in efficiency`;
      }
      
      return `${verb} ${cleanAchievement}`;
    } catch (error) {
      console.error('Error improving achievement:', error);
      return achievement;
    }
  }

  // Suggest action verbs
  async suggestActionVerbs(category) {
    try {
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
    } catch (error) {
      console.error('Error suggesting action verbs:', error);
      return [
        'Led', 'Managed', 'Developed', 'Implemented', 'Improved',
        'Created', 'Designed', 'Delivered', 'Achieved', 'Executed'
      ];
    }
  }

  // Helper methods
  calculateExperienceYears(resume) {
    try {
      if (!resume.workExperience || resume.workExperience.length === 0) {
        return 1;
      }

      let totalMonths = 0;
      resume.workExperience.forEach(exp => {
        const startDate = new Date(exp.startDate);
        const endDate = exp.current ? new Date() : new Date(exp.endDate || startDate);
        
        // Calculate months between dates
        totalMonths += (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
      });
      
      return Math.max(1, Math.round(totalMonths / 12));
    } catch (error) {
      console.error('Error calculating experience years:', error);
      return 5; // Default fallback
    }
  }
  
  getRoleType(position) {
    try {
      const positionLower = position.toLowerCase();
      
      if (positionLower.includes('lead') || 
          positionLower.includes('manager') || 
          positionLower.includes('director') || 
          positionLower.includes('senior') || 
          positionLower.includes('head')) {
        return 'leadership';
      } else if (positionLower.includes('developer') || 
                positionLower.includes('engineer') || 
                positionLower.includes('programmer') || 
                positionLower.includes('architect')) {
        return 'development';
      } else {
        return 'other';
      }
    } catch (error) {
      console.error('Error getting role type:', error);
      return 'other';
    }
  }
  
  extractJobTitle(jobDescription) {
    try {
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
    } catch (error) {
      console.error('Error extracting job title:', error);
      return 'the position';
    }
  }
  
  getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

module.exports = new BasicAIService();
