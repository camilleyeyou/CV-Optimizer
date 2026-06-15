const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { computeATSScore } = require('./atsScoring');

// Lazy Supabase client — created on first use so importing this module never
// throws when env vars are absent (e.g. unit tests that don't touch the cache).
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return _supabase;
}

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

  /**
   * Analyze a resume for ATS compatibility.
   *
   * The SCORE is produced entirely by the deterministic engine
   * (computeATSScore) — never by the model. The LLM only writes the
   * human-readable narrative ABOUT the computed breakdown. If the narrative
   * call fails or returns junk, we fall back to deterministic prose so the
   * score is always returned.
   */
  async analyzeATS(resumeText, jobTitle, jobDescription) {
    // LLM keyword extraction improves accuracy; matching/scoring stays in the
    // engine so the score is still reproducible. Falls back to the engine's
    // built-in extractor (providedKeywords = null) if extraction fails.
    const providedKeywords = await this.extractKeywordsLLM(jobDescription);
    const breakdown = computeATSScore({
      resumeText,
      jobDescription: jobDescription || '',
      providedKeywords,
    });

    let narrative;
    try {
      narrative = await this._writeNarrative(resumeText, jobTitle, breakdown);
    } catch {
      narrative = this._fallbackNarrative(breakdown);
    }

    return this._assembleAnalysis(breakdown, narrative);
  }

  /**
   * Extract screening keywords from a job description with the LLM
   * (temperature 0, JSON mode), cached in Supabase keyed by a sha256 hash of
   * the JD so the SAME job description always yields the SAME keyword list on
   * subsequent calls (cache survives Vercel cold starts, unlike an in-memory
   * Map). Returns null on any failure or when no JD is given, so the caller
   * falls back to the engine's deterministic built-in extractor.
   *
   * @returns {Promise<string[]|null>}
   */
  async extractKeywordsLLM(jobDescription) {
    const jd = String(jobDescription || '').trim();
    if (!jd) return null;

    const jdHash = crypto.createHash('sha256').update(jd).digest('hex');

    // 1. Cache lookup (persisted — reproducible across cold starts).
    try {
      const { data } = await getSupabase()
        .from('jd_keyword_cache')
        .select('keywords')
        .eq('jd_hash', jdHash)
        .single();
      if (data && Array.isArray(data.keywords) && data.keywords.length) {
        return data.keywords;
      }
    } catch {
      // Cache miss / table unavailable — fall through to extraction.
    }

    // 2. LLM extraction.
    let rawKeywords;
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Extract only the explicit skills and requirements a recruiter would screen for. Return JSON {"keywords":[...]}. No duplicates, no fluff.',
          },
          { role: 'user', content: jd.slice(0, 8000) },
        ],
        max_tokens: 500,
      });
      const content = response.choices?.[0]?.message?.content;
      if (!content) return null;
      const parsed = JSON.parse(content); // json_object guarantees valid JSON
      rawKeywords = Array.isArray(parsed.keywords) ? parsed.keywords : null;
    } catch {
      return null; // fall back to the engine's built-in extractor
    }
    if (!rawKeywords || !rawKeywords.length) return null;

    // Normalize: trim, lowercase, de-duplicate, cap. Deterministic shape.
    const seen = new Set();
    const keywords = [];
    for (const k of rawKeywords) {
      const s = String(k || '').trim().toLowerCase();
      if (s && !seen.has(s)) {
        seen.add(s);
        keywords.push(s);
      }
    }
    if (!keywords.length) return null;
    const finalKeywords = keywords.slice(0, 30);

    // 3. Persist for reproducibility on subsequent calls (non-fatal on error).
    try {
      await getSupabase()
        .from('jd_keyword_cache')
        .upsert({ jd_hash: jdHash, keywords: finalKeywords }, { onConflict: 'jd_hash' });
    } catch {
      // Caching is best-effort; scoring still works without it.
    }

    return finalKeywords;
  }

  /**
   * Build the response for the frontend (ATSChecker.jsx). Every numeric score
   * is taken from the engine breakdown; only the feedback prose comes from the
   * narrative. Sections are the engine's four true rubric categories
   * (keywords, formatting, content, completeness), each carrying its score,
   * its rubric weight, and the narrative feedback.
   */
  _assembleAnalysis(breakdown, narrative) {
    const c = breakdown.components;
    const w = breakdown.weights;
    const n = narrative || {};
    return {
      overall_score: breakdown.overall_score,
      band: breakdown.band,
      method: breakdown.method,
      weights: breakdown.weights,
      summary: n.summary || '',
      sections: {
        keywords: { score: c.keywords.score, weight: w.keywords, applicable: c.keywords.applicable, feedback: n.keywords || '', missing: c.keywords.missing },
        formatting: { score: c.formatting.score, weight: w.formatting, feedback: n.formatting || '' },
        content: { score: c.content.score, weight: w.content, feedback: n.content || '' },
        completeness: { score: c.completeness.score, weight: w.completeness, feedback: n.completeness || '' },
      },
      keyword_match: breakdown.keyword_match,
      strengths: Array.isArray(n.strengths) ? n.strengths : [],
      improvements: Array.isArray(n.improvements) ? n.improvements : [],
      components: breakdown.components,
    };
  }

  /**
   * Ask the model to EXPLAIN an already-computed ATS breakdown. It returns
   * only human-readable strings — it is explicitly forbidden from inventing or
   * changing scores, and the caller never reads any numbers it might emit.
   */
  async _writeNarrative(resumeText, jobTitle, breakdown) {
    const c = breakdown.components;
    const payload = {
      overall_score: breakdown.overall_score,
      band: breakdown.band,
      weights: breakdown.weights,
      keywords: { score: c.keywords.score, applicable: c.keywords.applicable, found: c.keywords.found, missing: c.keywords.missing },
      formatting: { score: c.formatting.score, checks: c.formatting.checks },
      content: { score: c.content.score, checks: c.content.checks },
      completeness: { score: c.completeness.score, checks: c.completeness.checks },
    };

    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are given a resume and its already-computed ATS breakdown. Explain the findings. Do NOT invent or change any scores.

Respond with ONLY valid JSON in this exact shape:
{
  "formatting": "1-2 sentences explaining the formatting/parse-ability result",
  "keywords": "1-2 sentences on keyword match, referencing found/missing keywords",
  "content": "1-2 sentences on writing quality (action verbs, quantified results)",
  "completeness": "1-2 sentences on section completeness",
  "strengths": ["short strength", "short strength", "short strength"],
  "improvements": [{"priority": "high|medium|low", "suggestion": "specific actionable fix"}],
  "summary": "2-3 sentence overall assessment"
}

Rules:
- Base every statement on the provided breakdown and resume.
- Reference the found/missing keywords by name where useful.
- Do NOT output any numeric score, percentage as a verdict, or alternative score. The scores are already final and are not yours to set.`,
        },
        {
          role: 'user',
          content: `Target role: ${jobTitle || 'Not specified'}

Computed ATS breakdown (authoritative — explain it, do not change it):
${JSON.stringify(payload)}

Resume:
${String(resumeText || '').slice(0, 6000)}`,
        },
      ],
      max_tokens: 900,
      temperature: 0.4,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty narrative response');
    const parsed = JSON.parse(content); // json_object guarantees valid JSON
    return {
      formatting: typeof parsed.formatting === 'string' ? parsed.formatting : '',
      keywords: typeof parsed.keywords === 'string' ? parsed.keywords : '',
      content: typeof parsed.content === 'string' ? parsed.content : '',
      completeness: typeof parsed.completeness === 'string' ? parsed.completeness : '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements
            .filter((i) => i && typeof i.suggestion === 'string')
            .map((i) => ({
              priority: ['high', 'medium', 'low'].includes(i.priority) ? i.priority : 'medium',
              suggestion: String(i.suggestion),
            }))
        : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    };
  }

  /** Deterministic prose used if the narrative LLM call fails. */
  _fallbackNarrative(breakdown) {
    const c = breakdown.components;
    const k = c.keywords;
    const improvements = [];
    if (k.applicable && k.missing.length) {
      improvements.push({ priority: 'high', suggestion: `Incorporate missing keywords where truthful: ${k.missing.slice(0, 8).join(', ')}.` });
    }
    if (c.content.score < 70) {
      improvements.push({ priority: 'medium', suggestion: 'Start bullet points with strong action verbs and add quantified results (%, $, counts).' });
    }
    if (c.completeness.score < 80) {
      improvements.push({ priority: 'medium', suggestion: 'Complete missing sections — summary, work experience, education, and at least 5 skills.' });
    }
    if (c.formatting.score < 80) {
      improvements.push({ priority: 'low', suggestion: 'Use standard section headings (Experience, Education, Skills) and clear, parseable dates.' });
    }
    const strengths = [];
    if (c.formatting.score >= 80) strengths.push('Clean, ATS-parseable formatting.');
    if (k.applicable && k.found.length) strengths.push(`Matches ${k.found.length} target keyword(s).`);
    if (c.content.score >= 70) strengths.push('Strong, results-oriented bullet points.');

    return {
      formatting: `Formatting and parse-ability scored ${c.formatting.score}/100.`,
      keywords: k.applicable
        ? `Matched ${k.found.length} of ${k.found.length + k.missing.length} target keywords (${k.score}/100).`
        : 'No job description was provided, so keyword matching was skipped.',
      content: `Content quality scored ${c.content.score}/100 based on action verbs and quantified results.`,
      completeness: `Section completeness scored ${c.completeness.score}/100.`,
      strengths,
      improvements,
      summary: `Overall ATS score is ${breakdown.overall_score}/100 (${breakdown.band}). ${improvements.length ? 'Address the highlighted improvements to raise it.' : 'This resume is well optimized for ATS.'}`,
    };
  }

  /** Deterministic quick tips from the breakdown (no model, fully reproducible). */
  _quickTips(breakdown) {
    const c = breakdown.components;
    const tips = [];
    if (c.keywords.applicable && c.keywords.missing.length) {
      tips.push(`Add missing keywords: ${c.keywords.missing.slice(0, 4).join(', ')}.`);
    }
    if (c.content.score < 70) tips.push('Lead bullets with action verbs and add metrics.');
    if (c.completeness.score < 80) tips.push('Fill gaps: summary, experience, education, 5+ skills.');
    if (c.formatting.score < 80) tips.push('Use standard headings and parseable dates.');
    if (!tips.length) tips.push('Strong resume — keep tailoring keywords per job.');
    return tips.slice(0, 3);
  }
  /**
   * Inline quick score (Builder widget). Score and keywords are deterministic
   * (from the engine); tips are derived deterministically from the breakdown.
   * No model call — fully reproducible. Shape kept as {score, tips,
   * missing_keywords} for the existing widget.
   */
  async quickScore(resumeData, jobTitle, jobDescription) {
    const resumeText = this._resumeDataToText(resumeData);
    const breakdown = computeATSScore({
      resumeText,
      structured: resumeData,
      jobDescription: jobDescription || '',
    });

    return {
      score: breakdown.overall_score,
      tips: this._quickTips(breakdown),
      missing_keywords: breakdown.keyword_match.missing.slice(0, 5),
      method: breakdown.method,
      weights: breakdown.weights,
    };
  }

  /**
   * Public quick score (landing page, raw resume text, no JD). The role title
   * is used as a lightweight keyword source. Deterministic — no model call.
   * Shape kept as {score, missing_keywords}.
   */
  async quickScoreFromText(resumeText, jobTitle) {
    const breakdown = computeATSScore({
      resumeText,
      jobDescription: jobTitle || '',
    });

    return {
      score: breakdown.overall_score,
      missing_keywords: breakdown.keyword_match.missing.slice(0, 5),
      method: breakdown.method,
      weights: breakdown.weights,
    };
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
