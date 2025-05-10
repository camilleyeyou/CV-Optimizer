const OpenAI = require('openai');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Generate professional summary
  async generateSummary(resumeData, jobTitle) {
    try {
      const prompt = `
        Generate a professional summary for a resume with the following details:
        
        Name: ${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}
        Target Job: ${jobTitle || 'Professional'}
        Skills: ${resumeData.skills.technical.join(', ')}
        Experience: ${resumeData.workExperience.length} positions
        
        The summary should be:
        - 2-3 sentences long
        - Written in first person
        - Highlight key achievements and skills
        - Tailored to the target job
        - Use strong action words
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a professional resume writer." },
          { role: "user", content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI Summary Generation Error:', error);
      throw new Error('Failed to generate summary');
    }
  }

  // Enhance work experience descriptions
  async enhanceExperience(experience) {
    try {
      const prompt = `
        Enhance the following work experience entry for a resume:
        
        Position: ${experience.position}
        Company: ${experience.company}
        Description: ${experience.description.join(' ')}
        
        Please improve this by:
        - Starting each bullet point with strong action verbs
        - Adding quantifiable achievements where possible
        - Making it more impactful and results-oriented
        - Keeping it concise and relevant
        
        Return as a JSON array of bullet points.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a professional resume writer. Return only a JSON array." },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('AI Experience Enhancement Error:', error);
      throw new Error('Failed to enhance experience');
    }
  }

  // Generate skill suggestions
  async suggestSkills(resumeData, jobDescription) {
    try {
      const prompt = `
        Based on the following resume and job description, suggest relevant skills:
        
        Current Skills: ${resumeData.skills.technical.join(', ')}
        Job Description: ${jobDescription}
        
        Please suggest:
        - 5-10 technical skills that would improve this resume
        - 3-5 soft skills relevant to the role
        
        Return as a JSON object with 'technical' and 'soft' arrays.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a career advisor. Return only a JSON object." },
          { role: "user", content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.6
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('AI Skill Suggestion Error:', error);
      throw new Error('Failed to suggest skills');
    }
  }

  // Generate cover letter
  async generateCoverLetter(resumeData, jobInfo) {
    try {
      const prompt = `
        Generate a professional cover letter with the following information:
        
        Applicant: ${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}
        Position: ${jobInfo.position}
        Company: ${jobInfo.company}
        Job Description: ${jobInfo.description}
        
        Key Skills: ${resumeData.skills.technical.slice(0, 5).join(', ')}
        Recent Position: ${resumeData.workExperience[0]?.position} at ${resumeData.workExperience[0]?.company}
        
        The cover letter should:
        - Be 3-4 paragraphs
        - Highlight relevant experience and skills
        - Show enthusiasm for the role
        - Include a strong opening and closing
        - Be professional yet personable
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a professional cover letter writer." },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI Cover Letter Generation Error:', error);
      throw new Error('Failed to generate cover letter');
    }
  }

  // Optimize resume for ATS
  async optimizeForATS(resumeData, jobDescription) {
    try {
      const prompt = `
        Analyze this resume against the job description and suggest ATS optimizations:
        
        Resume Summary: ${resumeData.summary}
        Skills: ${resumeData.skills.technical.join(', ')}
        Job Description: ${jobDescription}
        
        Provide:
        1. Keywords missing from the resume
        2. Suggestions to improve ATS scoring
        3. Format recommendations
        
        Return as a JSON object with 'keywords', 'suggestions', and 'formatting' arrays.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an ATS optimization expert. Return only a JSON object." },
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.6
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('AI ATS Optimization Error:', error);
      throw new Error('Failed to optimize for ATS');
    }
  }

  // Suggest action verbs
  async suggestActionVerbs(context) {
    try {
      const prompt = `
        Suggest 15 strong action verbs for a resume in the ${context} field.
        These should be impactful verbs that demonstrate leadership, achievement, and results.
        Return as a JSON array of strings.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a resume writing expert. Return only a JSON array." },
          { role: "user", content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.6
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('AI Action Verb Suggestion Error:', error);
      throw new Error('Failed to suggest action verbs');
    }
  }

  // Improve achievement statements
  async improveAchievement(achievement) {
    try {
      const prompt = `
        Improve this achievement statement for a resume:
        "${achievement}"
        
        Make it more impactful by:
        - Adding quantifiable metrics if possible
        - Starting with a strong action verb
        - Showing clear results or impact
        - Keeping it concise (under 20 words)
        
        Return only the improved statement.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a resume writing expert." },
          { role: "user", content: prompt }
        ],
        max_tokens: 50,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI Achievement Improvement Error:', error);
      throw new Error('Failed to improve achievement');
    }
  }
}

module.exports = new AIService();