import { useEffect, useState, useRef } from 'react';
import { getMyProfile, updateMyProfile, updateMyAvatar } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../common/FormInput';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Loader from '../common/Loader';

/**
 * Shared between /student/profile and /teacher/profile — role-specific
 * fields (rollNumber/semester vs designation) are shown conditionally
 * based on the logged-in user's role.
 */
export default function ProfileForm() {
  const { user: authUser, login } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    department: '',
    college: '',
    rollNumber: '',
    semester: '',
    designation: '',
  });
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        const { user, profile } = res.data.data;
        setForm({
          fullName: user.fullName || '',
          phone: user.phone || '',
          department: user.department || '',
          college: user.college || '',
          rollNumber: profile?.rollNumber || '',
          semester: profile?.semester || '',
          designation: profile?.designation || '',
        });
        setAvatarUrl(user.avatarUrl || '');
      })
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSaving(true);
    try {
      const res = await updateMyProfile(form);
      setSuccessMsg('Profile updated successfully.');
      // Keep AuthContext / localStorage in sync so the navbar name updates immediately
      login(res.data.data.user, localStorage.getItem('edumonitor_token'));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const res = await updateMyAvatar(file);
      setAvatarUrl(res.data.data.avatarUrl);
      login({ ...authUser, avatarUrl: res.data.data.avatarUrl }, localStorage.getItem('edumonitor_token'));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loader label="Loading profile..." />;

  const initials = form.fullName
    ? form.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const apiOrigin = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  return (
    <div>
      <h1 className="dashboard-welcome">Profile</h1>
      <p className="dashboard-subtitle">View and update your account details</p>

      <div className="profile-card">
        <Alert type="error" message={error} />
        <Alert type="success" message={successMsg} />

        <div className="profile-avatar-row">
          <div className="profile-avatar-lg">
            {avatarUrl ? <img src={`${apiOrigin}${avatarUrl}`} alt={form.fullName} /> : initials}
          </div>
          <div>
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
            >
              Change Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="profile-form-grid">
            <FormInput
              label="Full Name"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
            />
            <FormInput label="Email" value={authUser?.email || ''} disabled readOnly />
            <FormInput
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Optional"
            />
            <FormInput
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Optional"
            />
            <FormInput
              label="College"
              name="college"
              value={form.college}
              onChange={handleChange}
              placeholder="Optional"
            />

            {authUser?.role === 'student' && (
              <>
                <FormInput
                  label="Roll Number"
                  name="rollNumber"
                  value={form.rollNumber}
                  onChange={handleChange}
                  placeholder="Optional"
                />
                <FormInput
                  label="Semester"
                  name="semester"
                  value={form.semester}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </>
            )}

            {authUser?.role === 'teacher' && (
              <FormInput
                label="Designation"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="e.g. Assistant Professor"
              />
            )}
          </div>

          <Button type="submit" loading={saving} style={{ width: 'auto', padding: '0.6rem 1.5rem', marginTop: '0.5rem' }}>
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}
