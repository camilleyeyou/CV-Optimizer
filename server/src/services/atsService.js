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
}

module.exports = new ATSService();
