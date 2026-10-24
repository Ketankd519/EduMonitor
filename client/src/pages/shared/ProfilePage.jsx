import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { User, Save, CheckCircle, AlertCircle } from 'lucide-react';
import './ProfilePage.css';

const validateProfileField = (name, value, isTeacher) => {
  const trimmedValue = value.trim();

  if (name === 'name') {
    if (!trimmedValue) return 'Full name is required.';
    if (!/^[\p{L} ]+$/u.test(value)) {
      return 'Full name can contain letters and spaces only.';
    }
  }

  if (name === 'phone' && value) {
    if (!/^\d+$/.test(value)) return 'Phone number must contain digits only.';
    if (value.length !== 10) return 'Phone number must contain exactly 10 digits.';
  }

  if (name === 'college' && trimmedValue && !/^[\p{L} ]+$/u.test(value)) {
    return 'College / Institution can contain letters and spaces only.';
  }

  if (name === 'department' && value && !/^[A-Z]+$/.test(value)) {
    return 'Department can contain uppercase letters (A-Z) only.';
  }

  if (!isTeacher && name === 'semester' && value) {
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 12) {
      return 'Semester must be a whole number from 1 to 12.';
    }
  }

  if (
    isTeacher &&
    name === 'designation' &&
    trimmedValue &&
    !/^[\p{L} ]+$/u.test(value)
  ) {
    return 'Designation can contain letters and spaces only.';
  }

  return '';
};

const validateProfile = (formData, isTeacher) => {
  const fields = [
    'name',
    'phone',
    'college',
    'department',
    isTeacher ? 'designation' : 'semester'
  ];
  return fields.reduce((errors, field) => {
    const fieldError = validateProfileField(field, formData[field] || '', isTeacher);
    if (fieldError) errors[field] = fieldError;
    return errors;
  }, {});
};

const ProfilePage = () => {
  const { user, profile, fetchCurrentUser } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: profile?.phone || '',
    college: profile?.college || '',
    department: profile?.department || '',
    rollNumber: profile?.rollNumber || '',
    semester: profile?.semester || '',
    employeeId: profile?.employeeId || '',
    designation: profile?.designation || ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (user && profile) {
      setFormData({
        name: user.name || '',
        phone: profile.phone || '',
        college: profile.college || '',
        department: profile.department || '',
        rollNumber: profile.rollNumber || '',
        semester: profile.semester || '',
        employeeId: profile.employeeId || '',
        designation: profile.designation || ''
      });
      setValidationErrors({});
    }
  }, [user, profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isNumericField = name === 'phone' || name === 'semester';

    if (name === 'department' && value && !/^[A-Z]+$/.test(value)) {
      setValidationErrors((previous) => ({
        ...previous,
        department: validateProfileField(name, value, isTeacher)
      }));
      return;
    }

    if (
      isNumericField &&
      value &&
      (!/^\d+$/.test(value) || (name === 'phone' && value.length > 10))
    ) {
      const fieldError = validateProfileField(name, value, isTeacher);
      setValidationErrors((previous) => ({ ...previous, [name]: fieldError }));
      return;
    }

    setFormData((previous) => ({ ...previous, [name]: value }));
    const fieldError = validateProfileField(name, value, isTeacher);
    setValidationErrors((previous) => {
      const next = { ...previous };
      if (fieldError) next[name] = fieldError;
      else delete next[name];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const formErrors = validateProfile(formData, isTeacher);
    setValidationErrors(formErrors);
    if (Object.keys(formErrors).length > 0 || Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await API.put('/users/profile', formData);
      setMessage('Profile details updated successfully');
      fetchCurrentUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-layout">
        <Sidebar />

        <main className="profile-main">
          <div className="profile-card">
            <div className="profile-header">
              <User size={28} className="profile-header-icon" />

              <h2>
                {isTeacher
                  ? 'Teacher Academic Profile'
                  : 'Student Academic Profile'}
              </h2>
            </div>

            {message && (
              <div className="profile-alert profile-success">
                <CheckCircle size={18} />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="profile-alert profile-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="profile-form-grid">
                <div className="profile-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={validationErrors.name ? 'profile-input-invalid' : ''}
                    aria-invalid={Boolean(validationErrors.name)}
                    required
                  />
                  {validationErrors.name && (
                    <span className="profile-field-error" role="alert">
                      {validationErrors.name}
                    </span>
                  )}
                </div>

                <div className="profile-form-group">
                  <label>Email Address (Read-only)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="profile-readonly-input"
                  />
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="profile-form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    inputMode="numeric"
                    autoComplete="tel"
                    className={validationErrors.phone ? 'profile-input-invalid' : ''}
                    aria-invalid={Boolean(validationErrors.phone)}
                  />
                  {validationErrors.phone && (
                    <span className="profile-field-error" role="alert">
                      {validationErrors.phone}
                    </span>
                  )}
                </div>

                <div className="profile-form-group">
                  <label>College / Institution</label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    className={validationErrors.college ? 'profile-input-invalid' : ''}
                    aria-invalid={Boolean(validationErrors.college)}
                  />
                  {validationErrors.college && (
                    <span className="profile-field-error" role="alert">
                      {validationErrors.college}
                    </span>
                  )}
                </div>
              </div>

              <div className="profile-form-grid profile-last-grid">
                <div className="profile-form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g. CSE"
                    className={validationErrors.department ? 'profile-input-invalid' : ''}
                    aria-invalid={Boolean(validationErrors.department)}
                  />
                  {validationErrors.department && (
                    <span className="profile-field-error" role="alert">
                      {validationErrors.department}
                    </span>
                  )}
                </div>

                {!isTeacher ? (
                  <>
                    <div className="profile-form-group">
                      <label>Roll Number</label>
                      <input
                        type="text"
                        name="rollNumber"
                        value={formData.rollNumber}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="profile-form-group">
                      <label>Semester</label>
                      <input
                        type="text"
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        inputMode="numeric"
                        placeholder="e.g. 4"
                        className={validationErrors.semester ? 'profile-input-invalid' : ''}
                        aria-invalid={Boolean(validationErrors.semester)}
                      />
                      {validationErrors.semester && (
                        <span className="profile-field-error" role="alert">
                          {validationErrors.semester}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="profile-form-group">
                      <label>Employee ID</label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="profile-form-group">
                      <label>Designation</label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        placeholder="e.g. Assistant Professor"
                        className={validationErrors.designation ? 'profile-input-invalid' : ''}
                        aria-invalid={Boolean(validationErrors.designation)}
                      />
                      {validationErrors.designation && (
                        <span className="profile-field-error" role="alert">
                          {validationErrors.designation}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="profile-save-button"
              >
                <Save size={18} />
                <span>
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;