export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  console.log('API Request:', method, url);

  // Exact URL matching for /api/resumes
  if (url === '/api/resumes' || url === '/api/resumes/') {
    if (method === 'GET') {
      return res.status(200).json({
        success: true,
        resumes: [],
        message: 'Resumes fetched successfully - API working!'
      });
    }
    if (method === 'POST') {
      return res.status(200).json({
        success: true,
        resume: { id: Date.now().toString(), ...req.body },
        message: 'Resume created successfully'
      });
    }
  }

  // Auth endpoints
  if (url === '/api/auth/register') {
    if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    return res.status(200).json({
      success: true,
      user: { id: Date.now().toString(), email, name },
      token: 'mock-token-' + Date.now(),
      message: 'Registration successful!'
    });
  }

  if (url === '/api/auth/login') {
    if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    return res.status(200).json({
      success: true,
      user: { id: '1', email, name: 'Test User' },
      token: 'mock-token-' + Date.now(),
      message: 'Login successful!'
    });
  }

  // Default response
  return res.status(200).json({
    message: 'CV Optimizer API - Updated Version',
    requestedUrl: url,
    method: method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/resumes',
      'POST /api/resumes', 
      'POST /api/auth/register',
      'POST /api/auth/login'
    ]
  });
}
