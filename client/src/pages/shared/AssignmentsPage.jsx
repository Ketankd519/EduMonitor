import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { FileCheck, Plus, Clock, Award, CheckCircle2, AlertCircle, Trash2, Eye, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AssignmentsPage = () => {
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [duration, setDuration] = useState(30);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allowRetake, setAllowRetake] = useState(false);

  // Questions Builder State
  const [questions, setQuestions] = useState([
    { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', marks: 1 }
  ]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchAssignments(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    try {
      const res = await API.get('/classes');
      const fetchedClasses = res.data.classes || [];
      setClasses(fetchedClasses);
      if (fetchedClasses.length > 0) {
        setSelectedClassId(fetchedClasses[0]._id);
      }
    } catch (err) {
      console.error('Error fetching classes', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (classId) => {
    try {
      const res = await API.get(`/assignments/class/${classId}`);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Error fetching assignments', err);
    }
  };

  const handleAddQuestionField = () => {
    setQuestions([
      ...questions,
      { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', marks: 1 }
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await API.post('/assignments', {
        classId: selectedClassId,
        title,
        description: desc,
        durationMinutes: duration,
        startDate,
        endDate,
        allowRetake,
        questions
      });

      setShowCreateModal(false);
      setTitle('');
      setDesc('');
      setQuestions([{ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', marks: 1 }]);
      fetchAssignments(selectedClassId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create assignment test.');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this MCQ test and all student grades?')) return;
    try {
      await API.delete(`/assignments/${id}`);
      fetchAssignments(selectedClassId);
    } catch (err) {
      alert('Failed to delete assignment.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.75rem' }}>MCQ Examination System</h1>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Create timed online tests and evaluate student responses automatically</p>
            </div>

            {isTeacher && selectedClassId && (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{ background: 'var(--academic-green)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={18} />
                <span>Create MCQ Test</span>
              </button>
            )}
          </div>

          {/* Class Selector Dropdown */}
          <div style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>Select Classroom:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#fff', fontWeight: '500' }}
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.subjectTitle} ({c.classCode})
                </option>
              ))}
            </select>
          </div>

          {/* Assignments List */}
          {loading ? (
            <div>Loading tests...</div>
          ) : assignments.length === 0 ? (
            <div style={{ background: '#fff', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileCheck size={48} style={{ marginBottom: '1rem' }} />
              <h3>No MCQ tests published for this classroom yet.</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {assignments.map((assign) => (
                <div key={assign._id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ background: '#dbeafe', color: 'var(--primary-blue)', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        {assign.durationMinutes} Mins
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                        Total Marks: {assign.totalMarks}
                      </span>
                    </div>

                    <h3 style={{ margin: '0.5rem 0', color: 'var(--text-dark)' }}>{assign.title}</h3>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{assign.description}</p>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Deadline: {new Date(assign.endDate).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    {!isTeacher ? (
                      assign.userSubmission ? (
                        <div style={{ background: '#f0fdf4', padding: '0.65rem', borderRadius: '6px', textAlign: 'center', color: 'var(--academic-green)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          Score: {assign.userSubmission.score} / {assign.totalMarks} ({assign.userSubmission.percentage}%)
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/exam/${assign._id}`)}
                          style={{ width: '100%', background: 'var(--primary-blue)', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Start Test Now
                        </button>
                      )
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => navigate(`/assignment-results/${assign._id}`)}
                          style={{ flex: 1, background: 'var(--primary-blue)', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                        >
                          <Eye size={14} />
                          <span>View Submissions</span>
                        </button>
                        <button onClick={() => handleDeleteAssignment(assign._id)} style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: 'var(--danger-red)', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Assignment Modal */}
          {showCreateModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
                <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>

                <h2 style={{ margin: '0 0 1.25rem' }}>Create MCQ Examination</h2>

                <form onSubmit={handleCreateAssignment}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.2rem' }}>Title</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.2rem' }}>Duration (Minutes)</label>
                      <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.2rem' }}>Start Date/Time</label>
                      <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.2rem' }}>End Date/Time</label>
                      <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    </div>
                  </div>

                  {/* Question Builder List */}
                  <h3 style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>Questions Builder</h3>

                  {questions.map((q, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold' }}>Question #{idx + 1}</span>
                        {questions.length > 1 && (
                          <button type="button" onClick={() => handleRemoveQuestion(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger-red)', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Question Statement..."
                        value={q.questionText}
                        onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input type="text" placeholder="Option A" value={q.optionA} onChange={(e) => handleQuestionChange(idx, 'optionA', e.target.value)} required style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                        <input type="text" placeholder="Option B" value={q.optionB} onChange={(e) => handleQuestionChange(idx, 'optionB', e.target.value)} required style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                        <input type="text" placeholder="Option C" value={q.optionC} onChange={(e) => handleQuestionChange(idx, 'optionC', e.target.value)} required style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                        <input type="text" placeholder="Option D" value={q.optionD} onChange={(e) => handleQuestionChange(idx, 'optionD', e.target.value)} required style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Correct Option:</label>
                        <select value={q.correctOption} onChange={(e) => handleQuestionChange(idx, 'correctOption', e.target.value)} style={{ padding: '0.3rem', borderRadius: '4px' }}>
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={handleAddQuestionField} style={{ background: '#e2e8f0', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    + Add Another Question
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: '#e2e8f0', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" style={{ background: 'var(--academic-green)', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Publish Test</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AssignmentsPage;