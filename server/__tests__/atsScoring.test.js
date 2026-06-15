const { computeATSScore } = require('../src/services/atsScoring');
const atsService = require('../src/services/atsService');

const RESUME = `Jane Doe
Senior Software Engineer
jane.doe@example.com | +1 555 123 4567 | linkedin.com/in/janedoe

Summary
Senior engineer with 8 years building scalable web platforms.

Experience
Lead Engineer at Acme Corp (2021 - Present)
- Led migration to Kubernetes, reducing deploy time by 60%
- Built React and Node.js services serving 2M users
Software Engineer at Beta Inc (2018 - 2021)
- Developed REST APIs in Python and PostgreSQL

Education
B.S. in Computer Science, UT Austin (2014 - 2018)

Skills
JavaScript, React, Node.js, Python, PostgreSQL, AWS, Docker, Kubernetes`;

const JD = `We are looking for a Senior Software Engineer with strong experience in
React, Node.js, TypeScript, AWS, and Kubernetes. Experience with CI/CD and
PostgreSQL is required. Familiarity with GraphQL is a plus.`;

describe('computeATSScore — determinism', () => {
  test('same resume + JD returns an identical overall_score across runs', () => {
    const a = computeATSScore({ resumeText: RESUME, jobDescription: JD });
    const b = computeATSScore({ resumeText: RESUME, jobDescription: JD });
    expect(a.overall_score).toBe(b.overall_score);
    // The entire breakdown is reproducible, not just the headline number.
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('overall_score is a stable integer in [0,100]', () => {
    const { overall_score } = computeATSScore({ resumeText: RESUME, jobDescription: JD });
    expect(Number.isInteger(overall_score)).toBe(true);
    expect(overall_score).toBeGreaterThanOrEqual(0);
    expect(overall_score).toBeLessThanOrEqual(100);
  });

  test('keyword_match splits found vs missing from the JD', () => {
    const { keyword_match } = computeATSScore({ resumeText: RESUME, jobDescription: JD });
    // Present in resume:
    expect(keyword_match.found).toEqual(expect.arrayContaining(['react', 'kubernetes']));
    // In the JD but not the resume:
    expect(keyword_match.missing).toEqual(expect.arrayContaining(['typescript']));
  });

  test('no job description redistributes the keyword weight to 0', () => {
    const { weights, components } = computeATSScore({ resumeText: RESUME });
    expect(weights.keywords).toBe(0);
    expect(components.keywords.applicable).toBe(false);
  });

  test('method and weights are reported', () => {
    const result = computeATSScore({ resumeText: RESUME, jobDescription: JD });
    expect(result.method).toBe('deterministic-rubric-v1');
    expect(result.weights).toEqual({ keywords: 0.4, formatting: 0.25, content: 0.2, completeness: 0.15 });
  });
});

describe('atsService._assembleAnalysis — scores never come from the model', () => {
  const breakdown = computeATSScore({ resumeText: RESUME, jobDescription: JD });

  test('overall_score and section scores are sourced from the engine, not the narrative', () => {
    // A hostile narrative that tries to smuggle in different numbers.
    const hostileNarrative = {
      overall_score: 13,
      sections: { keywords: { score: 99 } },
      formatting: 'Looks great.',
      keywords: 'Matched most keywords.',
      content: 'Strong bullets.',
      completeness: 'All sections present.',
      strengths: ['x'],
      improvements: [{ priority: 'high', suggestion: 'y' }],
      summary: 'Nice resume.',
    };

    const out = atsService._assembleAnalysis(breakdown, hostileNarrative);

    expect(out.overall_score).toBe(breakdown.overall_score);
    expect(out.overall_score).not.toBe(13);
    expect(out.sections.keywords.score).toBe(breakdown.components.keywords.score);
    expect(out.sections.formatting.score).toBe(breakdown.components.formatting.score);
    expect(out.keyword_match).toEqual(breakdown.keyword_match);
    expect(out.method).toBe('deterministic-rubric-v1');
    expect(out.weights).toEqual(breakdown.weights);
    // Narrative prose is still surfaced.
    expect(out.summary).toBe('Nice resume.');
    expect(out.sections.formatting.feedback).toBe('Looks great.');
  });

  test('sections expose the engine\'s four true rubric categories with scores and weights', () => {
    const out = atsService._assembleAnalysis(breakdown, atsService._fallbackNarrative(breakdown));
    expect(Object.keys(out.sections).sort()).toEqual(['completeness', 'content', 'formatting', 'keywords']);
    for (const key of ['keywords', 'formatting', 'content', 'completeness']) {
      expect(typeof out.sections[key].score).toBe('number');
      expect(out.sections[key].weight).toBe(breakdown.weights[key]);
      expect(typeof out.sections[key].feedback).toBe('string');
    }
  });
});

describe('atsService._quickTips', () => {
  test('returns up to 3 deterministic tips', () => {
    const breakdown = computeATSScore({ resumeText: 'too short', jobDescription: JD });
    const t1 = atsService._quickTips(breakdown);
    const t2 = atsService._quickTips(breakdown);
    expect(t1.length).toBeLessThanOrEqual(3);
    expect(t1).toEqual(t2);
  });
});
