const OpenAI = require('openai');
const pdfParse = require('pdf-parse');

class ATSService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
      timeout: 30000,
      maxRetries: 2,
    });
    this.model = 'gpt-4o-mini';
  }

  async extractTextFromPDF(buffer) {
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  async analyzeATS(resumeText, jobTitle, jobDescription) {
    const prompt = jobDescription
      ? `Analyze this resume for ATS compatibility against the specific job posting.

Resume:
${resumeText}

Job Title: ${jobTitle}
Job Description:
${jobDescription}`
      : `Analyze this resume for ATS compatibility for the role of: ${jobTitle}

Resume:
${resumeText}`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `You are an expert ATS (Applicant Tracking System) analyst. Analyze resumes for ATS compatibility and provide detailed, actionable feedback.

Always respond with valid JSON in this exact format:
{
  "overall_score": <0-100>,
  "sections": {
    "formatting": {"score": <0-100>, "feedback": "specific feedback"},
    "keywords": {"score": <0-100>, "feedback": "specific feedback", "missing": ["keyword1", "keyword2"]},
    "experience": {"score": <0-100>, "feedback": "specific feedback"},
    "education": {"score": <0-100>, "feedback": "specific feedback"},
    "skills": {"score": <0-100>, "feedback": "specific feedback"},
    "summary": {"score": <0-100>, "feedback": "specific feedback"}
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": [
    {"priority": "high|medium|low", "suggestion": "specific actionable suggestion"}
  ],
  "keyword_match": {
    "found": ["keyword1", "keyword2"],
    "missing": ["keyword1", "keyword2"]
  },
  "summary": "2-3 sentence overall assessment"
}

Scoring guidelines:
- 90-100: Excellent ATS compatibility, likely to pass most systems
- 70-89: Good, but needs minor improvements
- 50-69: Fair, several issues that could cause rejection
- Below 50: Poor, significant changes needed

Be specific and actionable. Don't be generic.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1200,
      temperature: 0.3,
    });

    const choice = response.choices?.[0];
    if (!choice?.message?.content) {
      throw new Error('Empty response from AI');
    }

    const content = choice.message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse ATS analysis');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('Failed to parse ATS analysis');
    }
  }
  async optimizeResume(resumeText, jobTitle, jobDescription, atsResults) {
    const prompt = `You are an expert resume writer. Given the following resume text, job title, and job description, rewrite the resume to maximize ATS compatibility and match the job requirements.

CURRENT RESUME TEXT:
${resumeText}

TARGET JOB TITLE: ${jobTitle}
${jobDescription ? `\nJOB DESCRIPTION:\n${jobDescription}` : ''}
${atsResults ? `\nATS ANALYSIS (missing keywords to incorporate):\nMissing keywords: ${(atsResults.keyword_match?.missing || []).join(', ')}\nKey improvements needed: ${(atsResults.improvements || []).map(i => i.suggestion).join('; ')}` : ''}

INSTRUCTIONS:
- Keep all factual information (dates, companies, schools, degrees) from the original resume
- Rewrite bullet points to be more impactful and incorporate missing keywords naturally
- Optimize the summary/objective for the target role
- Reorder and emphasize skills relevant to the job
- Do NOT fabricate experience, education, or skills not implied by the original resume
- Make bullet points start with strong action verbs and include quantifiable results where possible

Respond with ONLY valid JSON in this exact format:
{
  "personal_info": {
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "job_title": "${jobTitle}",
    "location": "",
    "linkedin": "",
    "website": ""
  },
  "summary": "A compelling 2-3 sentence professional summary tailored to the target role",
  "work_experience": [
    {
      "position": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM or Present",
      "current": false,
      "description": "• Bullet point 1\\n• Bullet point 2\\n• Bullet point 3"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "School Name",
      "location": "City, State",
      "start_date": "YYYY",
      "end_date": "YYYY",
      "description": ""
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "projects": [],
  "certifications": [],
  "languages": []
}

Extract and optimize ALL information from the original resume. Fill in every field you can from the source text.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert ATS resume optimizer. You rewrite resumes to maximize ATS scores while keeping all factual information accurate. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 3000,
      temperature: 0.4,
    });

    const choice = response.choices?.[0];
    if (!choice?.message?.content) {
      throw new Error('Empty response from AI');
    }

    const content = choice.message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse optimized resume');
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Ensure required structure
      return {
        personal_info: parsed.personal_info || {},
        summary: parsed.summary || '',
        work_experience: Array.isArray(parsed.work_experience) ? parsed.work_experience : [],
        education: Array.isArray(parsed.education) ? parsed.education : [],
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
        languages: Array.isArray(parsed.languages) ? parsed.languages : [],
      };
    } catch {
      throw new Error('Failed to parse optimized resume');
    }
  }
}

module.exports = new ATSService();
