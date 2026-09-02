import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { BookOpen, Plus, Trash2, LogOut, ExternalLink, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClassesPage = () => {
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [createForm, setCreateForm] = useState({ subjectTitle: '', subjectCode: '', section: '' });
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await API.get('/classes');
      setClasses(res.data.classes || []);
    } catch (err) {
      setError('Failed to fetch enrolled/created classes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await API.post('/classes', createForm);
      setSuccess(`Classroom created! Code: ${res.data.class.classCode}`);
      setCreateForm({ subjectTitle: '', subjectCode: '', section: '' });
      setShowModal(false);
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create classroom.');
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await API.post('/classes/join', { classCode: joinCode });
      setSuccess(res.data.message);
      setJoinCode('');
      setShowModal(false);
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join classroom.');
    }
  };

  const handleLeaveClass = async (classId) => {
    if (!window.confirm('Are you sure you want to leave this class?')) return;
    try {
      await API.post(`/classes/${classId}/leave`);
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave class.');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class? All posts, notes, and tests will be removed.')) return;
    try {
      await API.delete(`/classes/${classId}`);
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete class.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.75rem' }}>
                {isTeacher ? 'My Classrooms' : 'Enrolled Classes'}
              </h1>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>
                {isTeacher ? 'Manage your subject sections and class codes' : 'Access your joined course feeds and learning materials'}
              </p>
            </div>

            <button
              onClick={() => { setError(''); setSuccess(''); setShowModal(true); }}
              style={{
                background: isTeacher ? 'var(--academic-green)' : 'var(--primary-blue)',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Plus size={18} />
              <span>{isTeacher ? 'Create Class' : 'Join Class'}</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--academic-green)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--danger-red)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Classroom Grid */}
          {loading ? (
            <div>Loading classrooms...</div>
          ) : classes.length === 0 ? (
            <div style={{ background: '#fff', padding: '3rem', borderRadius: '12px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>
                {isTeacher ? "You haven't created any classes yet." : "No classes joined yet."}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                {isTeacher ? 'Click "+ Create Class" to set up your first subject section.' : 'Click "+ Join Class" and enter a class code provided by your teacher.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {classes.map((cls) => (
                <div key={cls._id} style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    background: isTeacher ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                    color: '#fff',
                    padding: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                        Sec: {cls.section}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{cls.subjectCode}</span>
                    </div>
                    <h3 style={{ margin: '0.75rem 0 0', fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cls.subjectTitle}
                    </h3>
                  </div>

                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <strong>Class Code:</strong> <code style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px', color: 'var(--primary-blue)', fontWeight: 'bold' }}>{cls.classCode}</code>
                    </div>

                    {!isTeacher && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Instructor: Prof. {cls.teacher?.name}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <Link to={`/classroom/${cls._id}`} style={{
                        flex: 1,
                        background: 'var(--primary-blue)',
                        color: '#fff',
                        textAlign: 'center',
                        padding: '0.55rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}>
                        <span>Open Class</span>
                        <ExternalLink size={14} />
                      </Link>

                      {isTeacher ? (
                        <button onClick={() => handleDeleteClass(cls._id)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: 'var(--danger-red)', padding: '0.55rem', borderRadius: '6px', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button onClick={() => handleLeaveClass(cls._id)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: 'var(--danger-red)', padding: '0.55rem', borderRadius: '6px', cursor: 'pointer' }}>
                          <LogOut size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Creation / Joining Modal */}
          {showModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: '420px', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
                <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} color="var(--text-muted)" />
                </button>

                <h2 style={{ margin: '0 0 1.5rem', color: 'var(--text-dark)' }}>
                  {isTeacher ? 'Create New Classroom' : 'Join Classroom'}
                </h2>

                {isTeacher ? (
                  <form onSubmit={handleCreateClass}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Subject Title</label>
                      <input type="text" value={createForm.subjectTitle} onChange={(e) => setCreateForm({ ...createForm, subjectTitle: e.target.value })} placeholder="e.g. Java Programming" required style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Subject Code</label>
                      <input type="text" value={createForm.subjectCode} onChange={(e) => setCreateForm({ ...createForm, subjectCode: e.target.value })} placeholder="e.g. MC0004" required style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Section</label>
                      <input type="text" value={createForm.section} onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })} placeholder="e.g. A" required style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    </div>

                    <button type="submit" style={{ width: '100%', background: 'var(--academic-green)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Create Classroom
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleJoinClass}>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: '500' }}>Class Code</label>
                      <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="e.g. MC0004_A" required style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', textTransform: 'uppercase' }} />
                    </div>

                    <button type="submit" style={{ width: '100%', background: 'var(--primary-blue)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Join Classroom
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClassesPage;