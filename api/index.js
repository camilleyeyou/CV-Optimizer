export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req;

  // Route: /api/resumes or /api/ (Vercel adds the /api prefix)
  if (url === '/api' || url === '/api/' || url.includes('/resumes')) {
    if (req.method === 'GET') {
      return res.status(200).json({ 
        success: true, 
        resumes: [],
        message: 'Resumes endpoint working!'
      });
    }
    if (req.method === 'POST') {
      return res.status(200).json({ 
        success: true, 
        resume: { id: Date.now().toString(), ...req.body },
        message: 'Resume created successfully'
      });
    }
  }

  // Route: /api/register
  if (url.includes('/register')) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    return res.status(200).json({ 
      success: true, 
      user: { id: Date.now().toString(), email, name },
      token: 'mock-jwt-token-' + Date.now(),
      message: 'Registration successful'
    });
  }

  // Default response
  res.status(200).json({ 
    message: 'CV Optimizer API is running',
    url: url,
    method: req.method
  });
}
