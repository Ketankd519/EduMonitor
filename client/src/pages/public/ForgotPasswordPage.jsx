
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import {
  KeyRound,
  AlertCircle,
  CheckCircle,
  GraduationCap
} from 'lucide-react';
import './Auth.css';

import forgotBg from '../../assets/login-bg.png';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await API.post('/auth/check-email', { email });

      setSuccessMsg('Email found! You can now reset your password.');
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Email not found in our system.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      return setError(
        'New Password and Confirm Password do not match.'
      );
    }

    setLoading(true);

    try {
      await API.post('/auth/update-password', {
        email,
        newPassword
      });

      navigate('/login');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to update password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-layout-fullscreen"
      style={{ backgroundImage: `url(${forgotBg})` }}
    >
      {/* Floating Logo */}
      <div className="auth-brand-absolute">
        <GraduationCap size={36} className="brand-icon" />

        <Link to="/" className="forgot-brand-link">
          <span>EduMonitor</span>
        </Link>
      </div>

      {/* Right Panel */}
      <div className="auth-glass-panel">
        <div className="auth-card">
          <div className="auth-header">
            <div className="forgot-icon-wrapper">
              <div className="forgot-icon-circle">
                <KeyRound size={32} color="#2563EB" />
              </div>
            </div>

            <h2>
              Reset <span>Password</span>
            </h2>

            <p>
              {step === 1
                ? 'Enter your email address to verify your account.'
                : 'Create a new password for your account.'}
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="forgot-success-message">
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <form
            onSubmit={
              step === 1
                ? handleCheckEmail
                : handleUpdatePassword
            }
            className="auth-form"
          >
            <div className="form-group full-width">
              <label>Email Address</label>

              <input
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={step === 2}
                className={
                  step === 2 ? 'forgot-email-disabled' : ''
                }
                required
              />
            </div>

            {step === 2 && (
              <>
                <div className="form-group full-width">
                  <label>New Password</label>

                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Confirm Password</label>

                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-auth-submit"
            >
              {loading
                ? 'Processing...'
                : step === 1
                  ? 'Verify Email'
                  : 'Update Password'}
            </button>
          </form>

          {/* Footer Link */}
          <div className="auth-footer">
            Remember your password?{' '}
            <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
