const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
      timeout: 30000, // 30s timeout
      maxRetries: 2,
    });
    this.model = 'gpt-4o-mini';
  }

  _safeJsonParse(content, fallback) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return fallback;
    }
  }

  _safeJsonArrayParse(content) {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }

  _getResponse(response) {
    const choice = response.choices?.[0];
    if (!choice?.message?.content) {
      throw new Error('Empty response from AI');
    }
    return choice.message.content.trim();
  }

  async generateSummary(resumeData, jobTitle) {
    const position = jobTitle || resumeData.workExperience?.[0]?.position || 'Professional';
    const skills = Array.isArray(resumeData.skills)
      ? resumeData.skills.join(', ')
      : Object.values(resumeData.skills || {}).flat().join(', ');
    const experience = this._calculateYears(resumeData);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert resume writer. Write concise, impactful professional summaries. No fluff. Focus on measurable achievements and specific skills.',
        },
        {
          role: 'user',
          content: `Write a professional summary for a ${position} with ${experience}+ years of experience.\n\nSkills: ${skills}\n\nRules:\n- 3-4 sentences, max 80 words\n- Third person, no "I"\n- Lead with strongest qualification\n- Include specific technologies/skills\n- End with value proposition`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return this._getResponse(response);
  }

  async enhanceExperience(experience) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert resume writer. Transform job descriptions into achievement-focused bullet points. Always respond with a JSON array of strings.',
        },
        {
          role: 'user',
          content: `Improve these bullet points for: ${experience.position || 'Role'} at ${experience.company || 'Company'}\n\nCurrent:\n${(Array.isArray(experience.description) ? experience.description : []).join('\n') || 'No description provided'}\n\nRules:\n- Return exactly 4 bullet points as a JSON array\n- Start each with a strong action verb\n- Add metrics/numbers where possible (%, $, team size)\n- Focus on impact and results, not duties\n- Keep each under 25 words`,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const content = this._getResponse(response);
    const parsed = this._safeJsonArrayParse(content);
    if (parsed && Array.isArray(parsed)) return parsed;

    // Fallback: parse as newline-separated text
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.replace(/^[-•\d.]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  async generateCoverLetter(resume, jobDescription) {
    const name = `${resume.personalInfo?.firstName || ''} ${resume.personalInfo?.lastName || ''}`.trim();
    const position = resume.workExperience?.[0]?.position || '';
    const skills = Array.isArray(resume.skills)
      ? resume.skills.join(', ')
      : Object.values(resume.skills || {}).flat().join(', ');

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert cover letter writer. Write professional, personalized cover letters that connect the candidate\'s experience to the job requirements.',
        },
        {
          role: 'user',
          content: `Write a cover letter.\n\nCandidate: ${name}\nCurrent role: ${position}\nSkills: ${skills}\nExperience: ${this._calculateYears(resume)} years\n\nJob Description:\n${jobDescription}\n\nRules:\n- 3 paragraphs max\n- Under 250 words\n- Reference specific requirements from the job description\n- Highlight matching skills and experience\n- Professional but warm tone\n- Do not include addresses or date headers`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return this._getResponse(response);
  }

  async suggestSkills(resume, jobDescription) {
    const currentSkills = Array.isArray(resume.skills)
      ? resume.skills.join(', ')
      : Object.values(resume.skills || {}).flat().join(', ');

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'You are a career advisor. Suggest relevant skills based on job descriptions. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: `Suggest skills to add based on this job description.\n\nJob: ${jobDescription}\n\nCurrent skills: ${currentSkills}\n\nReturn JSON: {"technical": ["skill1", "skill2"], "soft": ["skill1", "skill2"]}\n- Only suggest skills NOT already listed\n- Max 5 technical, 3 soft\n- Be specific (e.g., "React" not "frontend")`,
        },
      ],
      max_tokens: 300,
      temperature: 0.5,
    });

    const content = this._getResponse(response);
    return this._safeJsonParse(content, { technical: [], soft: [] });
  }

  async tailorResume(resume, jobDescription) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'You are an ATS optimization expert. Analyze resumes against job descriptions and provide specific, actionable improvements. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: `Analyze this resume against the job description and suggest improvements.\n\nResume Summary: ${resume.summary || 'None'}\nSkills: ${JSON.stringify(resume.skills || [])}\nExperience: ${JSON.stringify((resume.workExperience || []).map((e) => ({ position: e.position, company: e.company, description: e.description })))}\n\nJob Description:\n${jobDescription}\n\nReturn JSON:\n{\n  "score": <0-100>,\n  "summary_suggestion": "improved summary",\n  "missing_keywords": ["keyword1", "keyword2"],\n  "improvements": [\n    {"section": "experience|skills|summary", "suggestion": "specific change"}\n  ]\n}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.5,
    });

    const content = this._getResponse(response);
    const parsed = this._safeJsonParse(content, null);
    if (!parsed) throw new Error('Failed to parse AI response');
    return parsed;
  }

  async generateQuestions(jobDescription) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a career coach helping someone build a resume tailored to a specific job. Based on the job description, generate smart questions to gather the information needed to build a perfect resume. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: `Based on this job description, generate questions to ask the candidate so we can build a tailored resume.

Job Description:
${jobDescription}

Return JSON:
{
  "job_title": "extracted job title",
  "company": "extracted company name or empty string",
  "questions": [
    {"id": "personal", "question": "What is your full name, email, phone number, and location?", "type": "text", "placeholder": "John Doe, john@email.com, +1-555-0000, New York, NY"},
    {"id": "experience", "question": "relevant question about their work experience for this role", "type": "textarea", "placeholder": "example answer"},
    {"id": "skills", "question": "relevant question about technical and soft skills", "type": "textarea", "placeholder": "example answer"},
    {"id": "education", "question": "relevant question about education", "type": "text", "placeholder": "example answer"},
    {"id": "achievements", "question": "relevant question about key achievements", "type": "textarea", "placeholder": "example answer"},
    {"id": "projects", "question": "relevant question about relevant projects", "type": "textarea", "placeholder": "example answer"}
  ]
}

Rules:
- Always include the personal info question first
- Make questions specific to the job requirements
- 6-8 questions total
- Each question should help extract info for a specific resume section
- Placeholders should show example answers relevant to the job`,
        },
      ],
      max_tokens: 800,
      temperature: 0.5,
    });

    const content = this._getResponse(response);
    const parsed = this._safeJsonParse(content, null);
    if (!parsed) throw new Error('Failed to parse questions');
    return parsed;
  }

  async generateResumeFromAnswers(jobDescription, answers, jobTitle) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume writer. Create a complete, ATS-optimized resume from candidate answers tailored to the specific job. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: `Create a complete resume tailored to this job.

Job Title: ${jobTitle || 'Not specified'}
Job Description:
${jobDescription}

Candidate's Answers:
${Object.entries(answers).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n\n')}

Return JSON in this exact format:
{
  "personal_info": {
    "first_name": "", "last_name": "", "email": "", "phone": "",
    "job_title": "${jobTitle || ''}", "location": "", "linkedin": "", "website": ""
  },
  "summary": "3-4 sentence professional summary tailored to the job",
  "work_experience": [
    {
      "id": "1", "position": "", "company": "", "location": "",
      "start_date": "YYYY-MM", "end_date": "YYYY-MM", "current": false,
      "description": ["achievement bullet 1", "achievement bullet 2", "achievement bullet 3"]
    }
  ],
  "education": [
    {"id": "1", "institution": "", "degree": "", "field_of_study": "", "start_date": "", "end_date": "", "gpa": ""}
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "projects": [],
  "certifications": [],
  "languages": [{"name": "English", "proficiency": "Native"}]
}

Rules:
- Extract personal info from the candidate's answers
- Write achievement-focused bullet points with action verbs and metrics
- Include keywords from the job description for ATS optimization
- Only include information the candidate actually provided
- Skills should include both what the candidate mentioned and relevant ones from the job`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.5,
    });

    const content = this._getResponse(response);
    const parsed = this._safeJsonParse(content, null);
    if (!parsed) throw new Error('Failed to generate resume');
    return parsed;
  }

  _calculateYears(resume) {
    if (!resume.workExperience?.length) return 1;
    try {
      const sorted = [...resume.workExperience].sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      );
      const first = new Date(sorted[0].startDate);
      const last = sorted[sorted.length - 1].current
        ? new Date()
        : new Date(sorted[sorted.length - 1].endDate);
      return Math.max(1, Math.round((last - first) / (365.25 * 24 * 60 * 60 * 1000)));
    } catch {
      return 1;
    }
  }
}

module.exports = new OpenAIService();
