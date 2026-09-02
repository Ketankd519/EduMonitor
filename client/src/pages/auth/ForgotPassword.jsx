import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/authApi';
import FormInput from '../../components/common/FormInput';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import '../../styles/auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devToken, setDevToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setDevToken('');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccessMsg(res.data.message);
      // No real email provider is configured yet (see project README) —
      // the dev token is surfaced here so the reset flow is testable end-to-end.
      if (res.data.data?.devResetToken) {
        setDevToken(res.data.data.devResetToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Forgot Password</h2>
        <p className="auth-subtitle">Enter your email and we'll help you reset it</p>

        <Alert type="error" message={error} />
        <Alert type="success" message={successMsg} />

        {devToken && (
          <div className="alert alert-success" style={{ wordBreak: 'break-all' }}>
            Dev mode (no email provider configured): use this token on the{' '}
            <Link to={`/reset-password/${devToken}`} className="auth-link">
              reset password page
            </Link>
            .
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Button type="submit" loading={loading}>
            Send Reset Link
          </Button>
        </form>

        <p className="auth-footer">
          Remembered your password?{' '}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
