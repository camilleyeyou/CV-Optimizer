export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('Request:', req.method, req.url);

  // Route: /api/resumes
  if (req.url.includes('resumes')) {
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        resumes: [],
        message: 'Resumes API working!'
      });
    }
    if (req.method === 'POST') {
      return res.status(200).json({
        success: true,
        resume: { id: '123', title: 'New Resume' },
        message: 'Resume created!'
      });
    }
  }

  // Route: /api/auth/register
  if (req.url.includes('register')) {
    if (req.method === 'POST') {
      return res.status(200).json({
        success: true,
        user: { id: '1', email: 'test@test.com' },
        token: 'mock-token-123',
        message: 'Registration successful!'
      });
    }
  }

  // Route: /api/auth/login
  if (req.url.includes('login')) {
    if (req.method === 'POST') {
      return res.status(200).json({
        success: true,
        user: { id: '1', email: 'test@test.com' },
        token: 'mock-token-123',
        message: 'Login successful!'
      });
    }
  }

  // Default response
  return res.status(200).json({
    message: 'CV Optimizer API',
    url: req.url,
    method: req.method,
    working: true
  });
}
