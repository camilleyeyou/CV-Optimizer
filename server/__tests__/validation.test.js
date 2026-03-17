const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// Mock auth middleware to bypass authentication for validation tests
jest.mock('../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  },
  optionalAuth: (req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  },
}));

// Mock credits middleware to bypass credit checks
jest.mock('../src/middleware/credits', () => ({
  requireCredits: (req, res, next) => {
    req.userPlan = 'pro';
    req.creditsRemaining = 99;
    next();
  },
  getCredits: (req, res) => {
    res.json({ plan: 'pro', credits: -1, max_credits: 5 });
  },
}));

// Mock OpenAI service to avoid real API calls
jest.mock('../src/services/openaiService', () => ({
  generateSummary: jest.fn().mockResolvedValue('A professional summary.'),
  enhanceExperience: jest.fn().mockResolvedValue(['Bullet 1', 'Bullet 2']),
  generateCoverLetter: jest.fn().mockResolvedValue('Dear Hiring Manager...'),
  suggestSkills: jest.fn().mockResolvedValue({ technical: ['React'], soft: ['Leadership'] }),
  tailorResume: jest.fn().mockResolvedValue({ score: 85, changes: [] }),
  generateQuestions: jest.fn().mockResolvedValue({ job_title: 'Engineer', questions: [] }),
  generateResumeFromAnswers: jest.fn().mockResolvedValue({ personal_info: {} }),
  generateInterviewQuestions: jest.fn().mockResolvedValue([]),
  evaluateAnswer: jest.fn().mockResolvedValue({ score: 8, strengths: [], improvements: [] }),
  generateEmail: jest.fn().mockResolvedValue({ subject: 'Test', body: 'Test body' }),
  translateResume: jest.fn().mockResolvedValue({ summary: 'Translated' }),
}));

const app = require('../src/server');

describe('Input validation', () => {
  describe('POST /api/ai/summary', () => {
    it('rejects missing resumeData', async () => {
      const res = await request(app)
        .post('/api/ai/summary')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/resume data/i);
    });

    it('accepts valid resumeData', async () => {
      const res = await request(app)
        .post('/api/ai/summary')
        .send({ resumeData: { skills: ['JavaScript'] } });
      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
    });
  });

  describe('POST /api/ai/cover-letter', () => {
    it('rejects missing jobDescription', async () => {
      const res = await request(app)
        .post('/api/ai/cover-letter')
        .send({ resumeData: {} });
      expect(res.status).toBe(400);
      expect(res.status).toBe(400);
    });

    it('rejects jobDescription that is too short', async () => {
      const res = await request(app)
        .post('/api/ai/cover-letter')
        .send({ resumeData: {}, jobDescription: 'short' });
      expect(res.status).toBe(400);
    });

    it('accepts valid input', async () => {
      const res = await request(app)
        .post('/api/ai/cover-letter')
        .send({
          resumeData: { skills: ['Python'] },
          jobDescription: 'We are looking for a software engineer with 3+ years of experience...',
        });
      expect(res.status).toBe(200);
      expect(res.body.coverLetter).toBeDefined();
    });
  });

  describe('POST /api/ai/suggest-skills', () => {
    it('rejects missing jobDescription', async () => {
      const res = await request(app)
        .post('/api/ai/suggest-skills')
        .send({ resumeData: {} });
      expect(res.status).toBe(400);
    });

    it('accepts valid input', async () => {
      const res = await request(app)
        .post('/api/ai/suggest-skills')
        .send({
          resumeData: { skills: ['Java'] },
          jobDescription: 'Looking for a backend developer with cloud experience and strong skills.',
        });
      expect(res.status).toBe(200);
      expect(res.body.suggestions).toBeDefined();
    });
  });

  describe('POST /api/ai/tailor', () => {
    it('rejects missing resumeData', async () => {
      const res = await request(app)
        .post('/api/ai/tailor')
        .send({ jobDescription: 'A valid job description for tailoring the resume.' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/ai/generate-questions', () => {
    it('rejects missing jobDescription', async () => {
      const res = await request(app)
        .post('/api/ai/generate-questions')
        .send({});
      expect(res.status).toBe(400);
    });

    it('accepts valid jobDescription', async () => {
      const res = await request(app)
        .post('/api/ai/generate-questions')
        .send({ jobDescription: 'We need a frontend developer with React and TypeScript experience.' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/ai/generate-resume', () => {
    it('rejects missing answers', async () => {
      const res = await request(app)
        .post('/api/ai/generate-resume')
        .send({ jobDescription: 'A valid job description for resume generation testing.' });
      expect(res.status).toBe(400);
    });

    it('accepts valid input', async () => {
      const res = await request(app)
        .post('/api/ai/generate-resume')
        .send({
          jobDescription: 'A valid job description for resume generation testing.',
          answers: { experience: 'I have 5 years of experience' },
        });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/ai/evaluate-answer', () => {
    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/ai/evaluate-answer')
        .send({ question: 'Tell me about yourself' });
      expect(res.status).toBe(400);
    });

    it('accepts valid input', async () => {
      const res = await request(app)
        .post('/api/ai/evaluate-answer')
        .send({
          question: 'Tell me about yourself',
          answer: 'I am a software engineer with 5 years of experience.',
          jobDescription: 'We are looking for a senior software engineer with leadership skills.',
        });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/ai/generate-email', () => {
    it('rejects invalid email type', async () => {
      const res = await request(app)
        .post('/api/ai/generate-email')
        .send({
          type: 'spam',
          context: { position: 'Engineer', company: 'Acme' },
        });
      expect(res.status).toBe(400);
    });

    it('rejects missing context fields', async () => {
      const res = await request(app)
        .post('/api/ai/generate-email')
        .send({
          type: 'follow-up',
          context: {},
        });
      expect(res.status).toBe(400);
    });

    it('accepts valid follow-up email', async () => {
      const res = await request(app)
        .post('/api/ai/generate-email')
        .send({
          type: 'follow-up',
          context: { position: 'Engineer', company: 'Acme' },
        });
      expect(res.status).toBe(200);
      expect(res.body.subject).toBeDefined();
    });
  });

  describe('POST /api/ai/translate-resume', () => {
    it('rejects missing targetLanguage', async () => {
      const res = await request(app)
        .post('/api/ai/translate-resume')
        .send({ resumeData: {} });
      expect(res.status).toBe(400);
    });

    it('accepts valid input', async () => {
      const res = await request(app)
        .post('/api/ai/translate-resume')
        .send({ resumeData: { summary: 'Hello' }, targetLanguage: 'French' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/pdf/generate', () => {
    it('rejects missing resumeData', async () => {
      const res = await request(app)
        .post('/api/pdf/generate')
        .send({});
      expect(res.status).toBe(400);
    });

    it('rejects invalid template', async () => {
      const res = await request(app)
        .post('/api/pdf/generate')
        .send({ resumeData: {}, template: 'hackerz' });
      expect(res.status).toBe(400);
    });
  });
});
