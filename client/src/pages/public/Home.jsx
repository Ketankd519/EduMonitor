import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkHealth } from '../../api/healthApi';

/**
 * Placeholder landing page for Phase 1.
 * The full marketing/landing design (hero, feature sections, etc.) is built
 * out properly later — this page's job right now is to prove the full
 * chain works: React -> Axios -> Express -> JSON response.
 */
export default function Home() {
  const [apiStatus, setApiStatus] = useState('checking...');

  useEffect(() => {
    checkHealth()
      .then((res) => setApiStatus(`API OK - DB: ${res.data.data.db}`))
      .catch(() => setApiStatus('API unreachable (start the server)'));
  }, []);

  return (
    <div style={{ padding: '3rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>EduMonitor</h1>
      <p>Smart Virtual Classroom with AI-Based Student Activity Monitoring</p>
      <p style={{ fontSize: '0.9rem', color: '#555' }}>Backend connectivity: {apiStatus}</p>
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </div>
  );
}
