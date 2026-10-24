import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { AlertCircle, GraduationCap } from 'lucide-react';
import './Auth.css';

// Import your full-screen background image here:
import registerBg from '../../assets/register-bg.png'; 

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const res = await register(formData);
      const role = (res?.user?.role || '').toUpperCase();
      if (role === 'TEACHER') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="auth-layout-fullscreen" 
      style={{ backgroundImage: `url(${registerBg})` }}
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
            <h2>Create <span>EduMonitor</span> Account</h2>
            <p>Join our community and access intelligent learning tools.</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group full-width">
              <label>Full Name</label>
              <input 
                type="text" 
                name="name" 
                placeholder="Full Name"
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email Address"
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Account Role</label>
                <select name="role" value={formData.role} onChange={handleChange}>
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Password"
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  placeholder="Confirm Password"
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-auth-submit">
              {loading ? 'Registering...' : 'Register Account'}
            </button>
          </form>

          {/* Social Registration Buttons */}
          <div className="auth-social">
            <button className="social-btn"><img src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" alt="Google" /></button>
            <button className="social-btn"><img src="https://cdn-icons-png.flaticon.com/512/732/732221.png" alt="Microsoft" /></button>
            <button className="social-btn"><img src="https://cdn-icons-png.flaticon.com/512/0/747.png" alt="Apple" /></button>
          </div>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;