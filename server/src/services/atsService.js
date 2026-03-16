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
  async quickScore(resumeData, jobTitle, jobDescription) {
    const resumeText = this._resumeDataToText(resumeData);

    const prompt = jobDescription
      ? `Score this resume for ATS compatibility against the job posting.\n\nResume:\n${resumeText}\n\nJob Title: ${jobTitle}\nJob Description:\n${jobDescription}`
      : `Score this resume for ATS compatibility for the role: ${jobTitle}\n\nResume:\n${resumeText}`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `You are an ATS scoring engine. Respond with ONLY valid JSON:
{"score": <0-100>, "tips": ["tip1", "tip2", "tip3"], "missing_keywords": ["kw1", "kw2"]}
- score: overall ATS compatibility score
- tips: top 3 most impactful improvements (short, actionable)
- missing_keywords: top 5 missing keywords from the job
Be concise. Each tip under 15 words.`,
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const choice = response.choices?.[0];
    if (!choice?.message?.content) {
      throw new Error('Empty response from AI');
    }

    const content = choice.message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse score');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('Failed to parse score');
    }
  }

  _resumeDataToText(data) {
    const parts = [];
    const p = data.personal_info || {};
    if (p.first_name || p.last_name) parts.push(`${p.first_name || ''} ${p.last_name || ''}`.trim());
    if (p.job_title) parts.push(p.job_title);
    if (data.summary) parts.push(`Summary: ${data.summary}`);
    if (data.work_experience?.length) {
      parts.push('Experience:');
      for (const exp of data.work_experience) {
        parts.push(`${exp.position || ''} at ${exp.company || ''}`);
        const desc = Array.isArray(exp.description) ? exp.description : [];
        desc.forEach((d) => parts.push(`- ${d}`));
      }
    }
    if (data.education?.length) {
      parts.push('Education:');
      for (const edu of data.education) {
        parts.push(`${edu.degree || ''} ${edu.field_of_study || ''} - ${edu.institution || ''}`);
      }
    }
    if (data.skills?.length) {
      parts.push(`Skills: ${data.skills.join(', ')}`);
    }
    return parts.join('\n');
  }

  async parseResumeToJSON(resumeText, source = 'resume') {
    const sourceHint = source === 'linkedin'
      ? `\nThis text was extracted from a LinkedIn PDF export. LinkedIn PDFs have a specific format:
- Name and headline at the top
- "Experience" section with company, title, dates, and descriptions
- "Education" section
- "Skills" section (may include endorsement counts — ignore the numbers)
- "Languages", "Certifications", "Projects", "Volunteer" sections may be present
- Ignore "connections", "people also viewed", and other LinkedIn UI artifacts\n`
      : '';

    const prompt = `Extract all information from this ${source === 'linkedin' ? 'LinkedIn profile' : 'resume'} text and return it as structured JSON.
${sourceHint}
${source === 'linkedin' ? 'LINKEDIN PROFILE' : 'RESUME'} TEXT:
${resumeText}

Return ONLY valid JSON in this exact format:
{
  "personal_info": {
    "first_name": "",
    "last_name": "",
    "email": "",
    "phone": "",
    "job_title": "",
    "location": "",
    "linkedin": "",
    "website": ""
  },
  "summary": "The professional summary or objective if present",
  "work_experience": [
    {
      "position": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM",
      "current": false,
      "description": ["Achievement bullet 1", "Achievement bullet 2"]
    }
  ],
  "education": [
    {
      "institution": "School Name",
      "degree": "Degree",
      "field_of_study": "Field",
      "location": "",
      "start_date": "YYYY",
      "end_date": "YYYY",
      "gpa": ""
    }
  ],
  "skills": ["skill1", "skill2"],
  "projects": [
    {"name": "", "description": "", "technologies": "", "url": ""}
  ],
  "certifications": [
    {"name": "", "issuer": "", "date": ""}
  ],
  "languages": [
    {"name": "", "proficiency": "Native|Fluent|Professional|Intermediate|Basic"}
  ]
}

Rules:
- Extract ALL information from the resume text — do not skip anything
- If a field is not found in the resume, use empty string or empty array
- Parse dates into YYYY-MM format when possible
- Split description into individual bullet points as array items
- Do not fabricate information not present in the resume`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a resume parser. Extract structured data from resume text. Always respond with valid JSON only. Be thorough — capture every detail.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 3000,
      temperature: 0.2,
    });

    const choice = response.choices?.[0];
    if (!choice?.message?.content) {
      throw new Error('Empty response from AI');
    }

    const content = choice.message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse resume');
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return this._normalizeResumeData(parsed);
    } catch {
      throw new Error('Failed to parse resume');
    }
  }

  _normalizeResumeData(parsed) {
    const normalizeDescription = (desc) => {
      if (Array.isArray(desc)) return desc.map(String);
      if (typeof desc === 'string') {
        return desc
          .split(/\n|•|▪|‣|➤/)
          .map((s) => s.replace(/^[-–—]\s*/, '').trim())
          .filter(Boolean);
      }
      return [];
    };

    const workExperience = (Array.isArray(parsed.work_experience) ? parsed.work_experience : []).map((exp) => ({
      ...exp,
      description: normalizeDescription(exp.description),
      current: exp.current || (exp.end_date && /present/i.test(exp.end_date)),
      end_date: exp.end_date && /present/i.test(exp.end_date) ? '' : exp.end_date || '',
    }));

    const skills = (Array.isArray(parsed.skills) ? parsed.skills : [])
      .map((s) => (typeof s === 'string' ? s : String(s)))
      .filter(Boolean);

    return {
      personal_info: parsed.personal_info || {},
      summary: parsed.summary || '',
      work_experience: workExperience,
      education: Array.isArray(parsed.education) ? parsed.education : [],
      skills,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages : [],
    };
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
      "description": ["Bullet point 1", "Bullet point 2", "Bullet point 3"]
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
      return this._normalizeResumeData(parsed);
    } catch {
      throw new Error('Failed to parse optimized resume');
    }
  }
}

module.exports = new ATSService();
