import React, { useState } from 'react';
import axios from 'axios';

const TestApi = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState('/api/health');

  const testEndpoint = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await axios.get(path);
      setResult(response.data);
    } catch (err) {
      console.error('API test error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>API Endpoint Tester</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          style={{ width: '300px', padding: '0.5rem' }}
        />
        <button 
          onClick={testEndpoint}
          disabled={loading}
          style={{
            marginLeft: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#4a6cf7',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Test
        </button>
      </div>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div style={{ 
          backgroundColor: '#fed7d7',
          color: '#e53e3e',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          Error: {error}
        </div>
      )}
      
      {result && (
        <div style={{ 
          backgroundColor: '#f0fff4',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <h3>Response:</h3>
          <pre style={{ 
            backgroundColor: '#edf2f7',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '2rem' }}>
        <h3>Common Test Paths:</h3>
        <ul>
          <li><button onClick={() => setPath('/api/health')}>Health Check: /api/health</button></li>
          <li><button onClick={() => setPath('/')}>Root: /</button></li>
          <li><button onClick={() => setPath('/api')}>API Root: /api</button></li>
        </ul>
      </div>
    </div>
  );
};

export default TestApi;
