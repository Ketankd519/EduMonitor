import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../../api/authApi';
import FormInput from '../../components/common/FormInput';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import '../../styles/auth.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errors = {};
    if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMsg('');
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      setSuccessMsg(res.data.message);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">Choose a new password for your account</p>

        <Alert type="error" message={serverError} />
        <Alert type="success" message={successMsg} />

        <form onSubmit={handleSubmit} noValidate>
          <FormInput
            label="New Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            placeholder="At least 8 characters"
          />
          <FormInput
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
            placeholder="Re-enter your new password"
          />
          <Button type="submit" loading={loading}>
            Reset Password
          </Button>
        </form>

        <p className="auth-footer">
          <Link to="/login" className="auth-link">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
