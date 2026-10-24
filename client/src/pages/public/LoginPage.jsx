
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { AlertCircle, GraduationCap } from 'lucide-react';
import './Auth.css';

import loginBg from '../../assets/login-bg.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      const role = (user.role || '').toUpperCase();

      if (role === 'TEACHER') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password, rememberMe);
      const role = (res?.user?.role || '').toUpperCase();

      if (role === 'TEACHER') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Login failed. Please check credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-layout-fullscreen"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Floating Logo */}
      <div className="auth-brand-absolute">
        <GraduationCap size={36} className="brand-icon" />
        <Link to="/" className="forgot-brand-link">
          <span>EduMonitor</span>
        </Link>
      </div>

      {/* Right Panel with Dark Blur */}
      <div className="auth-glass-panel">
        <div className="auth-card">
          <div className="auth-header">
            <h2>
              Welcome <span>Back</span>
            </h2>
            <p>
              Welcome to this information team in your academic universe.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group full-width">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-options-row">
              <label className="login-remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <div className="login-forgot-password">
                <Link to="/forgot-password">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-auth-submit"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">or</span>
            <div className="login-divider-line" />
          </div>

          {/* Social Login Buttons */}
          <div className="auth-social login-social">
            <button type="button" className="social-btn" aria-label="Google login">
              <img
                src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png"
                alt="Google"
              />
            </button>

            <button type="button" className="social-btn" aria-label="Microsoft login">
              <img
                src="https://cdn-icons-png.flaticon.com/512/732/732221.png"
                alt="Microsoft"
              />
            </button>

            <button type="button" className="social-btn" aria-label="Apple login">
              <img
                src="https://cdn-icons-png.flaticon.com/512/0/747.png"
                alt="Apple"
              />
            </button>
          </div>

          {/* Footer Link */}
          <div className="auth-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
