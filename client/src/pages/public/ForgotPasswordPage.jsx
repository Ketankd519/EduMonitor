import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import '../../styles/theme.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [tokenMsg, setTokenMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTokenMsg('');
    setLoading(true);

    try {
      const res = await API.post('/auth/forgot-password', { email });
      setTokenMsg(`Reset Token (Dev Mode): ${res.data.resetToken}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)', padding: '1rem' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <KeyRound size={40} color="var(--primary-blue)" />
          <h2 style={{ color: 'var(--primary-blue)', margin: '0.5rem 0 0' }}>Reset Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Enter email to obtain a reset token</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.75rem', borderRadius: '6px', color: 'var(--danger-red)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {tokenMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '0.75rem', borderRadius: '6px', color: 'var(--academic-green)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
              <CheckCircle size={18} />
              <span>Token Generated</span>
            </div>
            <code style={{ background: '#e2e8f0', padding: '0.4rem', borderRadius: '4px', wordBreak: 'break-all' }}>{tokenMsg}</code>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500', fontSize: '0.9rem' }}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--primary-blue)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Processing...' : 'Send Reset Link'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Back to <Link to="/login" style={{ color: 'var(--primary-blue)', textDecoration: 'none', fontWeight: '600' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;