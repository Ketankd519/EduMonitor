
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import {
  BookOpen,
  Plus,
  Trash2,
  LogOut,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './style.css';

const ClassesPage = () => {
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [createForm, setCreateForm] = useState({
    subjectTitle: '',
    subjectCode: '',
    section: ''
  });

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
      setCreateForm({
        subjectTitle: '',
        subjectCode: '',
        section: ''
      });
      setShowModal(false);
      fetchClasses();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to create classroom.'
      );
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await API.post('/classes/join', {
        classCode: joinCode
      });

      setSuccess(res.data.message);
      setJoinCode('');
      setShowModal(false);
      fetchClasses();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to join classroom.'
      );
    }
  };

  const handleLeaveClass = async (classId) => {
    if (!window.confirm('Are you sure you want to leave this class?')) {
      return;
    }

    try {
      await API.post(`/classes/${classId}/leave`);
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave class.');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this class? All posts, notes, and tests will be removed.'
      )
    ) {
      return;
    }

    try {
      await API.delete(`/classes/${classId}`);
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete class.');
    }
  };

  return (
    <div className="classes-page">
      <Navbar />

      <div className="classes-page-layout">
        <Sidebar />

        <main className="classes-page-main">
          {/* Header */}
          <div className="classes-header">
            <div>
              <h1>{isTeacher ? 'My Classrooms' : 'Enrolled Classes'}</h1>
              <p>
                {isTeacher
                  ? 'Manage your subject sections and class codes'
                  : 'Access your joined course feeds and learning materials'}
              </p>
            </div>

            <button
              type="button"
              className={`classes-primary-btn ${
                isTeacher ? 'teacher-action' : 'student-action'
              }`}
              onClick={() => {
                setError('');
                setSuccess('');
                setShowModal(true);
              }}
            >
              <Plus size={18} />
              <span>{isTeacher ? 'Create Class' : 'Join Class'}</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {success && (
            <div className="classes-feedback classes-success">
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="classes-feedback classes-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Classroom Grid */}
          {loading ? (
            <div className="classes-loading">Loading classrooms...</div>
          ) : classes.length === 0 ? (
            <div className="classes-empty-state">
              <BookOpen size={48} className="classes-empty-icon" />

              <h3>
                {isTeacher
                  ? "You haven't created any classes yet."
                  : 'No classes joined yet.'}
              </h3>

              <p>
                {isTeacher
                  ? 'Click "+ Create Class" to set up your first subject section.'
                  : 'Click "+ Join Class" and enter a class code provided by your teacher.'}
              </p>
            </div>
          ) : (
            <div className="classes-grid">
              {classes.map((cls) => (
                <article className="class-card" key={cls._id}>
                  <div
                    className={`class-card-header ${
                      isTeacher ? 'teacher-class-header' : 'student-class-header'
                    }`}
                  >
                    <div className="class-card-meta">
                      <span className="class-section">
                        Sec: {cls.section}
                      </span>
                      <span className="class-subject-code">
                        {cls.subjectCode}
                      </span>
                    </div>

                    <h3 title={cls.subjectTitle}>{cls.subjectTitle}</h3>
                  </div>

                  <div className="class-card-body">
                    <div className="class-code-row">
                      <strong>Class Code:</strong>
                      <code>{cls.classCode}</code>
                    </div>

                    {!isTeacher && (
                      <div className="class-instructor">
                        Instructor: Prof. {cls.teacher?.name}
                      </div>
                    )}

                    <div className="class-card-actions">
                      <Link
                        to={`/classroom/${cls._id}`}
                        className="class-open-btn"
                      >
                        <span>Open Class</span>
                        <ExternalLink size={14} />
                      </Link>

                      {isTeacher ? (
                        <button
                          type="button"
                          className="class-danger-btn"
                          aria-label="Delete class"
                          title="Delete class"
                          onClick={() => handleDeleteClass(cls._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="class-danger-btn"
                          aria-label="Leave class"
                          title="Leave class"
                          onClick={() => handleLeaveClass(cls._id)}
                        >
                          <LogOut size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Create / Join Modal */}
          {showModal && (
            <div
              className="classes-modal-overlay"
              onClick={() => setShowModal(false)}
            >
              <div
                className="classes-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="classes-modal-title"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="classes-modal-close"
                  aria-label="Close modal"
                  onClick={() => setShowModal(false)}
                >
                  <X size={20} />
                </button>

                <h2 id="classes-modal-title">
                  {isTeacher ? 'Create New Classroom' : 'Join Classroom'}
                </h2>

                {isTeacher ? (
                  <form onSubmit={handleCreateClass}>
                    <div className="classes-form-group">
                      <label htmlFor="subjectTitle">Subject Title</label>
                      <input
                        id="subjectTitle"
                        type="text"
                        value={createForm.subjectTitle}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            subjectTitle: e.target.value
                          })
                        }
                        placeholder="e.g. Java Programming"
                        required
                      />
                    </div>

                    <div className="classes-form-group">
                      <label htmlFor="subjectCode">Subject Code</label>
                      <input
                        id="subjectCode"
                        type="text"
                        value={createForm.subjectCode}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            subjectCode: e.target.value
                          })
                        }
                        placeholder="e.g. MC0004"
                        required
                      />
                    </div>

                    <div className="classes-form-group classes-form-last">
                      <label htmlFor="section">Section</label>
                      <input
                        id="section"
                        type="text"
                        value={createForm.section}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            section: e.target.value
                          })
                        }
                        placeholder="e.g. A"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="classes-submit-btn teacher-action"
                    >
                      Create Classroom
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleJoinClass}>
                    <div className="classes-form-group classes-form-last">
                      <label htmlFor="classCode">Class Code</label>
                      <input
                        id="classCode"
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="e.g. MC0004_A"
                        required
                        className="class-code-input"
                      />
                    </div>

                    <button
                      type="submit"
                      className="classes-submit-btn student-action"
                    >
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
