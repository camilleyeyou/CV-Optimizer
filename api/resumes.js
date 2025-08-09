export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      resumes: [],
      message: 'Resumes fetched successfully!'
    });
  }

  if (req.method === 'POST') {
    return res.status(200).json({
      success: true,
      resume: { id: Date.now().toString(), ...req.body },
      message: 'Resume created successfully'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
