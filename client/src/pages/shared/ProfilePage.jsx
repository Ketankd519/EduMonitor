import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { User, Save, CheckCircle, AlertCircle } from 'lucide-react';

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
    }
  }, [user, profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem', maxWidth: '800px' }}>
          <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <User size={28} color="var(--primary-blue)" />
              <h2 style={{ margin: 0, color: 'var(--text-dark)' }}>
                {isTeacher ? 'Teacher Academic Profile' : 'Student Academic Profile'}
              </h2>
            </div>

            {message && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '0.75rem', borderRadius: '6px', color: 'var(--academic-green)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <CheckCircle size={18} />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.75rem', borderRadius: '6px', color: 'var(--danger-red)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Email Address (Read-only)</label>
                  <input type="email" value={user?.email || ''} disabled style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#f1f5f9' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Phone Number</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>College / Institution</label>
                  <input type="text" name="college" value={formData.college} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Computer Applications" style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                </div>

                {!isTeacher ? (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Roll Number</label>
                      <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Semester</label>
                      <input type="text" name="semester" value={formData.semester} onChange={handleChange} placeholder="e.g. Semester 4" style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Employee ID</label>
                      <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Designation</label>
                      <input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. Assistant Professor" style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    </div>
                  </>
                )}
              </div>

              <button type="submit" disabled={loading} style={{ background: 'var(--primary-blue)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={18} />
                <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;