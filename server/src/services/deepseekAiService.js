const DeepSeekClient = require('./deepseekClient');

class DeepSeekAIService {
  constructor() {
    this.client = new DeepSeekClient(process.env.DEEPSEEK_API_KEY || '');
  }

  // Generate professional summary
  async generateSummary(resumeData, jobTitle) {
    try {
      const position = jobTitle || resumeData.workExperience[0]?.position || 'Professional';
      const skills = resumeData.skills.technical.join(', ');
      const experience = this.calculateExperienceYears(resumeData);
      
      const prompt = `
        Create a professional resume summary for a ${position} with ${experience}+ years of experience.
        
        Skills: ${skills}
        
        Guidelines:
        - Write in first person
        - 3-4 sentences only (max 100 words)
        - Highlight key skills and experience
        - Focus on achievements and value provided
        - Make it tailored to the ${position} role
      `;

      const response = await this.client.createChatCompletion({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an expert resume writer who creates powerful, concise professional summaries.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('DeepSeek summary generation error:', error);
      throw error;
    }
  }

  // Enhance work experience descriptions
  async enhanceExperience(experience) {
    try {
      const prompt = `
        Improve these job description bullet points for a resume:
        
        Position: ${experience.position}
        Company: ${experience.company}
        Current bullet points:
        ${experience.description?.join('\n') || 'No current description'}
        
        Guidelines:
        - Start each with powerful action verbs
        - Make them achievement-focused with metrics where possible
        - Keep each bullet to 1-2 lines max
        - Focus on results and impact, not just duties
        - Return exactly 4 bullet points formatted as a JSON array
      `;

      const response = await this.client.createChatCompletion({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an expert resume writer who creates impactful job descriptions.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400
      });

      // Try to extract JSON from the response
      const content = response.choices[0].message.content.trim();
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Fall back to line parsing if JSON parsing fails
          return content.split('\n')
            .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
            .map(line => line.replace(/^[-•]\s*/, '').trim());
        }
      }
      
      // If no JSON found, split by new lines and clean up
      return content.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•\d\.]\s*/, '').trim())
        .slice(0, 4);
    } catch (error) {
      console.error('DeepSeek experience enhancement error:', error);
      throw error;
    }
  }

  // Generate cover letter
  async generateCoverLetter(resume, jobDescription) {
    try {
      const prompt = `
        Write a professional cover letter for this job:
        
        Job Description:
        ${jobDescription}
        
        My Resume Info:
        - Name: ${resume.personalInfo.firstName} ${resume.personalInfo.lastName}
        - Current Position: ${resume.workExperience[0]?.position}
        - Skills: ${resume.skills.technical.join(', ')}
        - Experience: ${this.calculateExperienceYears(resume)} years
        
        Guidelines:
        - 3-4 paragraphs maximum
        - Professional and enthusiastic tone
        - Specifically mention skills that match the job description
        - Include a strong opening and conclusion
        - Keep under 300 words total
      `;

      const response = await this.client.createChatCompletion({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an expert cover letter writer.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('DeepSeek cover letter generation error:', error);
      throw error;
    }
  }

  // Suggest skills based on job description
  async suggestSkills(resume, jobDescription) {
    try {
      const currentSkills = [...resume.skills.technical, ...resume.skills.soft].join(', ');
      
      const prompt = `
        Based on this job description, suggest additional skills to add to my resume:
        
        Job Description:
        ${jobDescription}
        
        Current Skills:
        ${currentSkills}
        
        Return only skills I don't already have, formatted as a JSON object with two arrays:
        - "technical": [technical skills]
        - "soft": [soft skills]
      `;

      const response = await this.client.createChatCompletion({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an expert at matching skills to job descriptions.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300
      });

      // Try to extract JSON
      const content = response.choices[0].message.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Fallback if JSON parsing fails
          return this.extractSkillsFromText(content);
        }
      }
      
      // Fallback skill extraction
      return this.extractSkillsFromText(content);
    } catch (error) {
      console.error('DeepSeek skill suggestion error:', error);
      throw error;
    }
  }

  // Improve achievement statements
  async improveAchievement(achievement, context) {
    try {
      const prompt = `
        Improve this achievement statement for a resume:
        "${achievement}"
        
        Context: ${context || 'Professional resume'}
        
        Guidelines:
        - Start with strong action verb
        - Add specific metrics or percentages
        - Focus on results and impact
        - Keep under 20 words
        - Return only the improved statement
      `;

      const response = await this.client.createChatCompletion({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an expert resume writer.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('DeepSeek achievement improvement error:', error);
      throw error;
    }
  }

  // Suggest action verbs
  async suggestActionVerbs(category) {
    try {
      const prompt = `
        Provide 10 powerful action verbs for resume bullet points in the "${category || 'general'}" category.
        
        Return only a JSON array of strings, no explanations.
      `;

      const response = await this.client.createChatCompletion({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an expert resume writer.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200
      });

      // Try to extract JSON
      const content = response.choices[0].message.content.trim();
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Fallback if JSON parsing fails
          return content.split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^[-•\d\.]\s*/, '').trim())
            .slice(0, 10);
        }
      }
      
      // Fallback
      throw new Error('Failed to parse response');
    } catch (error) {
      console.error('DeepSeek action verb suggestion error:', error);
      throw error;
    }
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

  extractSkillsFromText(text) {
    const technical = [];
    const soft = [];
    
    // Common technical skills to look for
    const techSkills = [
      'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js', 'Express',
      'Python', 'Django', 'Flask', 'Java', 'Spring', 'C#', '.NET', 'PHP', 'Laravel',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'DevOps', 'Git',
      'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API'
    ];
    
    // Common soft skills to look for
    const softSkills = [
      'Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Time Management',
      'Critical Thinking', 'Decision Making', 'Organization', 'Interpersonal',
      'Adaptability', 'Flexibility', 'Creativity', 'Attention to Detail', 'Project Management'
    ];
    
    // Check for tech skills
    techSkills.forEach(skill => {
      if (text.includes(skill)) {
        technical.push(skill);
      }
    });
    
    // Check for soft skills
    softSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        soft.push(skill);
      }
    });
    
    return { technical, soft };
  }
}

module.exports = new DeepSeekAIService();
