/**
 * Deterministic ATS scoring engine.
 *
 * The SCORE is computed entirely in code so it is reproducible (same input ->
 * same output) and explainable as a transparent weighted rubric. No network
 * calls happen here. The LLM (in atsService) is used only to (a) optionally
 * extract job-description keywords and (b) write the human-readable narrative
 * ABOUT the score this engine produces.
 *
 * Rubric (when a job description is provided):
 *   keywordMatch  40%
 *   formatting    25%   (ATS parse-ability)
 *   content       20%
 *   completeness  15%
 * When no job description is provided, the keyword weight is redistributed.
 */

// ---------------------------------------------------------------------------
// Text utilities
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'for', 'of', 'to',
  'in', 'on', 'at', 'by', 'with', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'this', 'that', 'these', 'those', 'it', 'its', 'we', 'you', 'they',
  'he', 'she', 'will', 'would', 'should', 'can', 'could', 'may', 'might', 'must',
  'have', 'has', 'had', 'do', 'does', 'did', 'not', 'no', 'so', 'than', 'such',
  'from', 'into', 'about', 'our', 'your', 'their', 'who', 'which', 'what', 'when',
  'where', 'how', 'all', 'any', 'each', 'more', 'most', 'other', 'some', 'up',
  'out', 'over', 'per', 'via', 'etc', 'role', 'job', 'work', 'working', 'looking',
  'ideal', 'candidate', 'responsibilities', 'requirements', 'including', 'within',
]);

// Common skill/term aliases so equivalent terms match. Extend freely.
const ALIASES = {
  js: 'javascript', 'java script': 'javascript', ecmascript: 'javascript',
  ts: 'typescript', py: 'python', 'c sharp': 'csharp', 'c#': 'csharp',
  'node': 'nodejs', 'node js': 'nodejs', 'node.js': 'nodejs',
  'react js': 'react', 'react.js': 'react', reactjs: 'react',
  'next js': 'nextjs', 'next.js': 'nextjs',
  postgres: 'postgresql', psql: 'postgresql',
  k8s: 'kubernetes', gcp: 'googlecloud', 'google cloud': 'googlecloud',
  ml: 'machinelearning', 'machine learning': 'machinelearning',
  ai: 'artificialintelligence',
  ci: 'cicd', 'ci cd': 'cicd', 'ci/cd': 'cicd',
  mgmt: 'management', 'project mgmt': 'projectmanagement',
  ux: 'userexperience', ui: 'userinterface',
  saas: 'softwareasaservice', api: 'api', apis: 'api', rest: 'restapi',
};

// A small lexicon used only to BOOST candidate keywords during deterministic
// extraction (not required for matching). Extend with your domain terms.
const SKILL_LEXICON = new Set([
  'javascript', 'typescript', 'python', 'java', 'csharp', 'php', 'ruby', 'go',
  'rust', 'swift', 'kotlin', 'sql', 'nosql', 'react', 'angular', 'vue', 'nextjs',
  'nodejs', 'express', 'django', 'flask', 'fastapi', 'spring', 'rails',
  'postgresql', 'mysql', 'mongodb', 'redis', 'graphql', 'restapi', 'docker',
  'kubernetes', 'aws', 'azure', 'googlecloud', 'terraform', 'cicd', 'git',
  'machinelearning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'tableau',
  'excel', 'powerbi', 'figma', 'agile', 'scrum', 'jira', 'salesforce',
  'projectmanagement', 'leadership', 'communication', 'analytics', 'seo',
  'marketing', 'accounting', 'finance', 'recruiting', 'onboarding',
]);

const ACTION_VERBS = new Set([
  'led', 'built', 'designed', 'developed', 'created', 'managed', 'launched',
  'implemented', 'improved', 'increased', 'reduced', 'delivered', 'drove',
  'owned', 'architected', 'optimized', 'automated', 'scaled', 'shipped',
  'spearheaded', 'established', 'streamlined', 'negotiated', 'mentored',
  'coordinated', 'analyzed', 'engineered', 'migrated', 'deployed', 'founded',
  'generated', 'achieved', 'executed', 'directed', 'oversaw', 'transformed',
]);

const WEAK_PHRASES = [
  'responsible for', 'duties included', 'team player', 'hard working',
  'hardworking', 'go-getter', 'think outside the box', 'detail oriented',
  'detail-oriented', 'self-starter', 'results-driven', 'fast learner',
];

const FIRST_PERSON = /\b(i|me|my|mine|myself)\b/gi;

function lower(s) {
  return String(s || '').toLowerCase();
}

/** Very light stemmer — conservative, reproducible, no dependencies. */
function stem(word) {
  let w = word;
  const suffixes = ['izations', 'ization', 'ements', 'ement', 'ically', 'ingly',
    'edly', 'ings', 'ing', 'ies', 'ied', 'ation', 'ments', 'ment', 'ness',
    'ers', 'er', 'es', 'ed', 'ly', 's'];
  for (const suf of suffixes) {
    if (w.length > suf.length + 2 && w.endsWith(suf)) {
      w = w.slice(0, -suf.length);
      if (suf === 'ies' || suf === 'ied') w += 'y';
      break;
    }
  }
  return w;
}

function applyAlias(term) {
  const key = lower(term).trim();
  return ALIASES[key] || key;
}

/** Tokenize to lowercase word tokens (letters/digits, keeps + # for c++/c#). */
function tokenize(text) {
  return lower(text)
    .replace(/[^\w+#\s.-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Build a normalized, stemmed, space-joined string for phrase matching. */
function stemmedString(text) {
  return tokenize(text)
    .map((t) => stem(applyAlias(t)))
    .join(' ');
}

/** Does a (possibly multi-word) keyword appear in the stemmed resume string? */
function keywordPresent(resumeStemmed, keyword) {
  const kw = applyAlias(keyword);
  const stemmedKw = kw.split(/\s+/).map((t) => stem(t)).join(' ');
  if (!stemmedKw) return false;
  const padded = ` ${resumeStemmed} `;
  return padded.includes(` ${stemmedKw} `) || padded.includes(` ${stemmedKw}`);
}

// ---------------------------------------------------------------------------
// Job-description keyword extraction (deterministic fallback)
// ---------------------------------------------------------------------------

/**
 * Extract candidate keywords from a job description, deterministically.
 * Returns an ordered, de-duplicated list of normalized keywords with weights.
 * For higher accuracy you can instead pass an LLM-extracted list (temperature 0,
 * cached by JD hash) into computeATSScore via `providedKeywords`.
 */
function extractJDKeywords(jobDescription, max = 20) {
  const cleanTok = (t) => t.replace(/^[.\-]+|[.\-]+$/g, '');
  const isStop = (t) => !t || t.length < 2 || STOPWORDS.has(t) || /^\d+$/.test(t);

  const candidates = new Map(); // normalizedPhrase -> score
  const bump = (phrase, amount) => {
    const norm = applyAlias(phrase);
    if (!norm) return;
    candidates.set(norm, (candidates.get(norm) || 0) + amount);
  };

  // Split into clauses first so n-grams never cross sentence/punctuation
  // boundaries (this is what produced noise like "aws. experience").
  const clauses = lower(jobDescription).split(/[.;,\n!?()]+/);
  for (const clause of clauses) {
    const toks = clause
      .replace(/[^\w+#\s.-]/g, ' ')
      .split(/\s+/)
      .map(cleanTok)
      .filter(Boolean);

    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (!isStop(t)) bump(t, 1 + (SKILL_LEXICON.has(applyAlias(t)) ? 3 : 0));
      // Bigram only when BOTH tokens are content words (no stopword edges).
      if (i < toks.length - 1) {
        const t2 = toks[i + 1];
        if (!isStop(t) && !isStop(t2)) {
          const bi = `${t} ${t2}`;
          bump(bi, 1.5 + (SKILL_LEXICON.has(applyAlias(bi)) ? 3 : 0));
        }
      }
    }
  }

  // Deterministic ordering: score desc, then alphabetical to break ties.
  const ranked = [...candidates.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .map(([term, score]) => ({ term, score }));

  // Drop a multi-word phrase's component unigrams to reduce redundancy.
  const chosen = [];
  const covered = new Set();
  for (const c of ranked) {
    if (chosen.length >= max) break;
    const words = c.term.split(' ');
    if (words.length === 1 && covered.has(c.term)) continue;
    chosen.push(c.term);
    words.forEach((w) => covered.add(w));
  }
  return chosen;
}

// ---------------------------------------------------------------------------
// Resume feature extraction
// ---------------------------------------------------------------------------

function extractFeatures(resumeText, structured = {}) {
  const text = String(resumeText || '');
  const lowerText = lower(text);
  const tokens = tokenize(text);
  const wordCount = tokens.length;

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(text);
  const hasLinkedin = /linkedin\.com|linkedin\b/i.test(text);

  const sectionHits = {
    experience: /\b(experience|employment|work history|professional)\b/i.test(text),
    education: /\b(education|academic|degree|university|bachelor|master)\b/i.test(text),
    skills: /\b(skills|technologies|competenc|proficienc)\b/i.test(text),
  };

  // Date patterns (e.g., 2021, Jan 2021, 01/2021, 2019-2022, Present)
  const dateMatches = text.match(
    /\b((19|20)\d{2}|present|current|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{1,2}\/\d{4})\b/gi
  ) || [];

  // Bullets: prefer structured descriptions, else split lines.
  let bullets = [];
  const we = structured.work_experience || structured.workExperience || [];
  if (Array.isArray(we) && we.length) {
    for (const exp of we) {
      const d = Array.isArray(exp.description) ? exp.description : [];
      bullets.push(...d.filter(Boolean));
    }
  }
  if (!bullets.length) {
    bullets = text
      .split(/\n|•|▪|‣|◦|·/)
      .map((l) => l.trim())
      .filter((l) => l.length > 12 && /[a-z]/i.test(l));
  }

  const bulletsStartingWithVerb = bullets.filter((b) => {
    const first = stem(applyAlias(tokenize(b)[0] || ''));
    return ACTION_VERBS.has(first) || ACTION_VERBS.has(applyAlias(tokenize(b)[0] || ''));
  }).length;

  const quantifiedBullets = bullets.filter((b) =>
    /(\d+\s?%|\$\s?\d|\d[\d,.]*\s*(k|m|million|users|customers|hours|x|percent)|\b\d{2,}\b)/i.test(b)
  ).length;

  const firstPersonCount = (text.match(FIRST_PERSON) || []).length;
  const weakPhraseCount = WEAK_PHRASES.reduce(
    (n, p) => n + (lowerText.includes(p) ? 1 : 0), 0
  );

  // Structured completeness signals (fall back to text if not provided).
  const skills = structured.skills || [];
  const skillCount = Array.isArray(skills)
    ? skills.length
    : Object.values(skills || {}).flat().length;

  return {
    wordCount,
    hasEmail, hasPhone, hasLinkedin,
    sectionHits,
    dateCount: dateMatches.length,
    bulletCount: bullets.length,
    bulletsStartingWithVerb,
    quantifiedBullets,
    firstPersonCount,
    weakPhraseCount,
    hasSummary: Boolean(structured.summary && String(structured.summary).trim()) ||
      /\b(summary|profile|objective)\b/i.test(text),
    experienceCount: Array.isArray(we) ? we.length :
      (sectionHits.experience ? 1 : 0),
    educationCount: Array.isArray(structured.education) ? structured.education.length :
      (sectionHits.education ? 1 : 0),
    skillCount: skillCount || (sectionHits.skills ? 5 : 0),
  };
}

// ---------------------------------------------------------------------------
// Component scorers (each returns 0–100) + evidence
// ---------------------------------------------------------------------------

function scoreKeywords(resumeText, keywords) {
  if (!keywords.length) return { score: 0, found: [], missing: [], applicable: false };
  const resumeStemmed = stemmedString(resumeText);
  const found = [];
  const missing = [];
  for (const kw of keywords) {
    (keywordPresent(resumeStemmed, kw) ? found : missing).push(kw);
  }
  const score = Math.round((found.length / keywords.length) * 100);
  return { score, found, missing, applicable: true };
}

function scoreFormatting(f) {
  let pts = 0;
  const checks = [];
  const add = (cond, weight, label) => {
    if (cond) pts += weight;
    checks.push({ label, passed: Boolean(cond), weight });
  };
  // Parse-ability: near-empty extracted text = likely scanned/image PDF.
  add(f.wordCount >= 150, 25, 'Resume text is machine-readable (not image/scan)');
  add(f.hasEmail, 15, 'Email address detected');
  add(f.hasPhone, 10, 'Phone number detected');
  add(f.sectionHits.experience, 15, 'Standard "Experience" section heading');
  add(f.sectionHits.education, 10, 'Standard "Education" section heading');
  add(f.sectionHits.skills, 10, 'Standard "Skills" section heading');
  add(f.dateCount >= 2, 10, 'Parseable employment dates present');
  add(f.wordCount >= 300 && f.wordCount <= 1200, 5, 'Healthy length (300–1200 words)');
  return { score: Math.min(100, pts), checks };
}

function scoreContent(f) {
  const checks = [];
  let pts = 0;
  const verbRatio = f.bulletCount ? f.bulletsStartingWithVerb / f.bulletCount : 0;
  const quantRatio = f.bulletCount ? f.quantifiedBullets / f.bulletCount : 0;

  const verbPts = Math.round(verbRatio * 40);
  const quantPts = Math.round(quantRatio * 35);
  pts += verbPts + quantPts;
  checks.push({ label: 'Bullets start with strong action verbs', value: `${Math.round(verbRatio * 100)}%`, points: verbPts });
  checks.push({ label: 'Bullets include quantified results', value: `${Math.round(quantRatio * 100)}%`, points: quantPts });

  const noFirstPerson = f.firstPersonCount === 0 ? 15 : Math.max(0, 15 - f.firstPersonCount * 3);
  pts += noFirstPerson;
  checks.push({ label: 'Avoids first-person pronouns', value: f.firstPersonCount, points: noFirstPerson });

  const noWeak = f.weakPhraseCount === 0 ? 10 : Math.max(0, 10 - f.weakPhraseCount * 5);
  pts += noWeak;
  checks.push({ label: 'Avoids weak/cliché phrases', value: f.weakPhraseCount, points: noWeak });

  return { score: Math.min(100, pts), checks };
}

function scoreCompleteness(f) {
  const checks = [];
  let pts = 0;
  const add = (cond, weight, label) => {
    if (cond) pts += weight;
    checks.push({ label, passed: Boolean(cond), weight });
  };
  add(f.hasSummary, 20, 'Has a professional summary');
  add(f.experienceCount >= 1, 35, 'Has at least one work experience entry');
  add(f.educationCount >= 1, 20, 'Has an education section');
  add(f.skillCount >= 5, 25, 'Lists at least 5 skills');
  return { score: Math.min(100, pts), checks };
}

// ---------------------------------------------------------------------------
// Top-level: compute the full, reproducible breakdown
// ---------------------------------------------------------------------------

/**
 * @param {object} args
 * @param {string} args.resumeText        Plain text of the resume.
 * @param {object} [args.structured]      Structured resume data (optional, improves accuracy).
 * @param {string} [args.jobDescription]  Job posting text (enables keyword scoring).
 * @param {string[]} [args.providedKeywords]  Pre-extracted JD keywords (e.g. from LLM at temp 0). Overrides the deterministic extractor.
 * @returns {object} Reproducible score breakdown.
 */
function computeATSScore({ resumeText, structured = {}, jobDescription = '', providedKeywords = null }) {
  const features = extractFeatures(resumeText, structured);

  const keywords = jobDescription
    ? (providedKeywords && providedKeywords.length
        ? providedKeywords.map(applyAlias)
        : extractJDKeywords(jobDescription))
    : [];

  const keywordResult = scoreKeywords(resumeText, keywords);
  const formatting = scoreFormatting(features);
  const content = scoreContent(features);
  const completeness = scoreCompleteness(features);

  // Weights — explicit and documented for defensibility.
  let weights = keywordResult.applicable
    ? { keywords: 0.40, formatting: 0.25, content: 0.20, completeness: 0.15 }
    : { keywords: 0.00, formatting: 0.40, content: 0.30, completeness: 0.30 };

  const overall = Math.round(
    keywordResult.score * weights.keywords +
    formatting.score * weights.formatting +
    content.score * weights.content +
    completeness.score * weights.completeness
  );

  return {
    overall_score: overall,
    band: overall >= 90 ? 'excellent' : overall >= 70 ? 'good' : overall >= 50 ? 'fair' : 'poor',
    weights,
    components: {
      keywords: { score: keywordResult.score, weight: weights.keywords, found: keywordResult.found, missing: keywordResult.missing, applicable: keywordResult.applicable },
      formatting: { score: formatting.score, weight: weights.formatting, checks: formatting.checks },
      content: { score: content.score, weight: weights.content, checks: content.checks },
      completeness: { score: completeness.score, weight: weights.completeness, checks: completeness.checks },
    },
    keyword_match: { found: keywordResult.found, missing: keywordResult.missing },
    features,
    method: 'deterministic-rubric-v1',
  };
}

module.exports = {
  computeATSScore,
  extractJDKeywords,
  extractFeatures,
  // exported for unit tests
  _internal: { stem, applyAlias, keywordPresent, stemmedString },
};
