export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('API called:', req.method, req.url);

  const { url, method } = req;

  // Helper function to get user from token (mock for now)
  const getUserFromToken = (req) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      return { id: '1', email: 'user@example.com', name: 'Test User' };
    }
    return null;
  };

  // Health check
  if (url === '/api/health') {
    return res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'Connected'
    });
  }

  // Authentication endpoints
  if (url === '/api/auth/login') {
    if (method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    return res.status(200).json({ 
      success: true, 
      user: { id: '1', email, name: 'Test User' },
      token: 'mock-jwt-token-' + Date.now(),
      message: 'Login successful'
    });
  }

  if (url === '/api/auth/register') {
    if (method !== 'POST') {
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

  if (url === '/api/auth/me') {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json({ success: true, user });
  }

  // Resume endpoints
  if (url === '/api/resumes') {
    if (method === 'GET') {
      return res.status(200).json({ 
        success: true, 
        resumes: [
          {
            id: '1',
            title: 'Software Developer Resume',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        message: 'Resumes fetched successfully'
      });
    }
    
    if (method === 'POST') {
      const resumeData = req.body;
      return res.status(200).json({ 
        success: true, 
        resume: { 
          id: Date.now().toString(), 
          ...resumeData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        message: 'Resume created successfully'
      });
    }
  }

  // Single resume endpoints (GET, PUT, DELETE /api/resumes/:id)
  const resumeIdMatch = url.match(/^\/api\/resumes\/([^\/]+)$/);
  if (resumeIdMatch) {
    const resumeId = resumeIdMatch[1];
    
    if (method === 'GET') {
      return res.status(200).json({
        success: true,
        resume: {
          id: resumeId,
          title: 'Sample Resume',
          personalInfo: { name: 'John Doe', email: 'john@example.com' },
          experience: [],
          education: [],
          skills: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    }

    if (method === 'PUT') {
      const resumeData = req.body;
      return res.status(200).json({
        success: true,
        resume: {
          id: resumeId,
          ...resumeData,
          updatedAt: new Date().toISOString()
        },
        message: 'Resume updated successfully'
      });
    }

    if (method === 'DELETE') {
      return res.status(200).json({
        success: true,
        message: 'Resume deleted successfully'
      });
    }
  }

  // PDF generation
  if (url === '/api/pdf/generate') {
    if (method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'PDF generation endpoint - would generate PDF here',
      pdfUrl: 'mock-pdf-url.pdf'
    });
  }

  // AI endpoints
  if (url === '/api/ai/summary') {
    if (method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    return res.status(200).json({
      success: true,
      summary: 'This is a mock AI-generated summary for your resume.',
      message: 'AI summary generated successfully'
    });
  }

  if (url === '/api/ai/enhance-experience') {
    if (method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    return res.status(200).json({
      success: true,
      enhancedExperience: {
        ...req.body.experience,
        description: 'Enhanced: ' + (req.body.experience?.description || 'Sample enhanced description')
      },
      message: 'Experience enhanced successfully'
    });
  }

  if (url === '/api/ai/suggest-skills') {
    if (method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    return res.status(200).json({
      success: true,
      suggestedSkills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
      message: 'Skills suggested successfully'
    });
  }

  if (url === '/api/ai/cover-letter') {
    if (method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    return res.status(200).json({
      success: true,
      coverLetter: 'This is a mock AI-generated cover letter based on your resume and the job description.',
      message: 'Cover letter generated successfully'
    });
  }

  // Default response
  res.status(200).json({ 
    message: 'CV Optimizer API is running',
    url: url,
    method: method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/me',
      'GET /api/resumes',
      'POST /api/resumes',
      'GET /api/resumes/:id',
      'PUT /api/resumes/:id',
      'DELETE /api/resumes/:id',
      'POST /api/pdf/generate',
      'POST /api/ai/summary',
      'POST /api/ai/enhance-experience',
      'POST /api/ai/suggest-skills',
      'POST /api/ai/cover-letter'
    ]
  });
}