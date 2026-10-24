import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import DateTimePicker, { formatDateTimeDisplay } from '../../components/common/DateTimePicker';
import {
  FileCheck,
  Plus,
  Clock,
  Trash2,
  Eye,
  X,
  Edit3,
  CheckCircle,
  AlertCircle,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './style2.css';

const AssignmentsPage = () => {
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';
  const navigate = useNavigate();
  const location = useLocation();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightedAssignmentId, setHighlightedAssignmentId] = useState('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [duration, setDuration] = useState(30);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allowRetake, setAllowRetake] = useState(false);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [createError, setCreateError] = useState('');
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A'
    }
  ]);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editHasSubmissions, setEditHasSubmissions] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editAllowRetake, setEditAllowRetake] = useState(false);
  const [editMarksPerQuestion, setEditMarksPerQuestion] = useState(1);
  const [editNegativeMarks, setEditNegativeMarks] = useState(0);
  const [editQuestions, setEditQuestions] = useState([]);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Teacher Submissions Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAssignment, setReviewAssignment] = useState(null);
  const [reviewSubmissions, setReviewSubmissions] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [togglingRelease, setTogglingRelease] = useState(false);

  // Student Result & Review Modal State
  const [showStudentResultModal, setShowStudentResultModal] = useState(false);
  const [studentResultData, setStudentResultData] = useState(null);
  const [studentResultLoading, setStudentResultLoading] = useState(false);

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

      const navClassId = location.state?.classId || new URLSearchParams(location.search).get('classId');
      const navAssignId = location.state?.assignmentId || new URLSearchParams(location.search).get('assignmentId');
      if (navAssignId) {
        setHighlightedAssignmentId(navAssignId);
      }

      if (navClassId && fetchedClasses.some((c) => c._id === navClassId)) {
        setSelectedClassId(navClassId);
      } else if (fetchedClasses.length > 0) {
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

  // --- Questions Builder Handlers (Create Form) ---
  const handleAddQuestionField = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A'
      }
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

  // --- Create Assignment Submission ---
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!startDate || !endDate) {
      setCreateError('Please select both Start and End date/time.');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setCreateError('End date/time must be strictly after the start date/time.');
      return;
    }

    if (Number(marksPerQuestion) <= 0 || isNaN(Number(marksPerQuestion))) {
      setCreateError('Marks per question must be a positive number.');
      return;
    }

    if (Number(negativeMarks) < 0 || isNaN(Number(negativeMarks))) {
      setCreateError('Negative marks per wrong answer cannot be negative.');
      return;
    }

    try {
      await API.post('/assignments', {
        classId: selectedClassId,
        title,
        description: desc,
        durationMinutes: Number(duration),
        startDate,
        endDate,
        allowRetake: Boolean(allowRetake),
        marksPerQuestion: Number(marksPerQuestion),
        negativeMarks: Number(negativeMarks),
        questions
      });

      setShowCreateModal(false);
      setTitle('');
      setDesc('');
      setDuration(30);
      setStartDate('');
      setEndDate('');
      setAllowRetake(false);
      setMarksPerQuestion(1);
      setNegativeMarks(0);
      setQuestions([
        {
          questionText: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctOption: 'A'
        }
      ]);

      fetchAssignments(selectedClassId);
    } catch (err) {
      setCreateError(
        err.response?.data?.message || 'Failed to create MCQ examination.'
      );
    }
  };

  // --- Open Edit Modal (Teacher) ---
  const handleOpenEdit = async (assignmentId) => {
    setEditError('');
    try {
      const res = await API.get(`/assignments/${assignmentId}`);
      const a = res.data.assignment;
      const qList = res.data.questions || [];

      setEditingAssignment(a);
      setEditHasSubmissions(Boolean(res.data.hasSubmissions || res.data.submissionCount > 0));
      setEditTitle(a.title || '');
      setEditDesc(a.description || '');
      setEditDuration(a.durationMinutes || 30);
      setEditStartDate(a.startDate ? a.startDate.slice(0, 16) : '');
      setEditEndDate(a.endDate ? a.endDate.slice(0, 16) : '');
      setEditAllowRetake(Boolean(a.allowRetake));
      setEditMarksPerQuestion(a.marksPerQuestion ?? 1);
      setEditNegativeMarks(a.negativeMarks ?? 0);
      setEditQuestions(
        qList.map((q) => ({
          _id: q._id,
          questionText: q.questionText || '',
          optionA: q.optionA || '',
          optionB: q.optionB || '',
          optionC: q.optionC || '',
          optionD: q.optionD || '',
          correctOption: q.correctOption || 'A'
        }))
      );
      setShowEditModal(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not load examination for editing.');
    }
  };

  // --- Questions Builder Handlers (Edit Form) ---
  const handleEditAddQuestion = () => {
    setEditQuestions([
      ...editQuestions,
      {
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A'
      }
    ]);
  };

  const handleEditQuestionChange = (index, field, value) => {
    const updated = [...editQuestions];
    updated[index][field] = value;
    setEditQuestions(updated);
  };

  const handleEditRemoveQuestion = (index) => {
    if (editQuestions.length === 1) return;
    setEditQuestions(editQuestions.filter((_, i) => i !== index));
  };

  // --- Save Edited Assignment ---
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editStartDate || !editEndDate) {
      setEditError('Please select both Start and End date/time.');
      return;
    }

    if (new Date(editEndDate) <= new Date(editStartDate)) {
      setEditError('End date/time must be strictly after start date/time.');
      return;
    }

    setEditSaving(true);
    try {
      const payload = {
        title: editTitle,
        description: editDesc,
        durationMinutes: Number(editDuration),
        startDate: editStartDate,
        endDate: editEndDate,
        allowRetake: Boolean(editAllowRetake)
      };

      if (!editHasSubmissions) {
        payload.marksPerQuestion = Number(editMarksPerQuestion);
        payload.negativeMarks = Number(editNegativeMarks);
        payload.questions = editQuestions;
      }

      await API.put(`/assignments/${editingAssignment._id}`, payload);
      setShowEditModal(false);
      fetchAssignments(selectedClassId);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save examination updates.');
    } finally {
      setEditSaving(false);
    }
  };

  // --- Open Review Submissions Modal (Teacher) ---
  const handleOpenReview = async (assign) => {
    setReviewAssignment(assign);
    setReviewLoading(true);
    setShowReviewModal(true);
    setExpandedStudentId(null);
    try {
      const res = await API.get(`/submissions/assignment/${assign._id}`);
      setReviewSubmissions(res.data.submissions || []);
      if (res.data.assignment) {
        setReviewAssignment((prev) => ({
          ...prev,
          ...res.data.assignment
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not load student submissions.');
      setShowReviewModal(false);
    } finally {
      setReviewLoading(false);
    }
  };

  // --- Toggle Answer Key Release (Teacher) ---
  const handleToggleReleaseAnswers = async () => {
    if (!reviewAssignment) return;
    setTogglingRelease(true);
    const newReleaseState = !reviewAssignment.answersReleased;
    try {
      await API.put(`/assignments/${reviewAssignment._id}/release-answers`, {
        release: newReleaseState
      });
      setReviewAssignment((prev) => ({
        ...prev,
        answersReleased: newReleaseState
      }));
      fetchAssignments(selectedClassId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle answer key release.');
    } finally {
      setTogglingRelease(false);
    }
  };

  // --- Open Student Result & Answer Key Modal (Student) ---
  const handleOpenStudentResult = async (assignId) => {
    setStudentResultLoading(true);
    setShowStudentResultModal(true);
    try {
      const [examRes, subsRes] = await Promise.all([
        API.get(`/assignments/${assignId}`),
        API.get(`/submissions/assignment/${assignId}/my-submissions`)
      ]);

      setStudentResultData({
        assignment: examRes.data.assignment,
        questions: examRes.data.questions || [],
        submissions: subsRes.data.submissions || [],
        answersReleased: Boolean(examRes.data.answersReleased || subsRes.data.answersReleased),
        bestSubmission: examRes.data.userSubmission
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Could not load your examination result.');
      setShowStudentResultModal(false);
    } finally {
      setStudentResultLoading(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this MCQ examination and all student grades?')) {
      return;
    }

    try {
      await API.delete(`/assignments/${id}`);
      fetchAssignments(selectedClassId);
    } catch (err) {
      alert('Failed to delete assignment.');
    }
  };

  return (
    <div className="assignments-page">
      <Navbar />

      <div className="assignments-layout">
        <Sidebar />

        <main className="assignments-main">
          {/* Page Header */}
          <div className="assignments-header">
            <div>
              <h1 className="assignments-heading">
                MCQ Examination System
              </h1>

              <p className="assignments-subtitle">
                Create timed online tests, configure negative marking, and evaluate responses automatically
              </p>
            </div>

            {isTeacher && selectedClassId && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="assignment-create-btn"
              >
                <Plus size={18} />
                <span>Create MCQ Test</span>
              </button>
            )}
          </div>

          {/* Class Selector */}
          <div className="assignment-class-selector">
            <label htmlFor="assignment-class">
              Select Classroom:
            </label>

            <select
              id="assignment-class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
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
            <div className="assignment-empty-state">
              <FileCheck
                size={48}
                className="assignment-empty-icon"
              />

              <h3>
                No MCQ tests published for this classroom yet.
              </h3>
            </div>
          ) : (
            <div className="assignments-grid">
              {assignments.map((assign) => {
                const now = new Date();
                const deadlineDate = new Date(assign.endDate);
                const isDeadlinePassed = now > deadlineDate;

                return (
                  <div
                    key={assign._id}
                    id={`assignment-${assign._id}`}
                    className={`assignment-card ${highlightedAssignmentId === assign._id ? 'assignment-card-highlighted' : ''}`}
                  >
                    <div>
                      {/* Top Badges & Meta */}
                      <div className="assignment-card-meta">
                        <span className="assignment-duration">
                          <Clock size={12} />
                          {assign.durationMinutes} Mins
                        </span>

                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          {isDeadlinePassed ? (
                            <span className="assignment-badge-expired">Expired</span>
                          ) : (
                            <span className="assignment-badge-open">Open</span>
                          )}
                          <span className="assignment-total-marks">
                            Total: {assign.totalMarks} Marks
                          </span>
                        </div>
                      </div>

                      {/* Marking Scheme Indicators */}
                      <div className="assignment-marking-meta">
                        <span className="assignment-badge-tag">
                          +{assign.marksPerQuestion ?? 1} mark/question
                        </span>
                        {assign.negativeMarks > 0 ? (
                          <span className="assignment-badge-tag assignment-badge-neg">
                            -{assign.negativeMarks} neg. mark
                          </span>
                        ) : (
                          <span className="assignment-badge-tag">
                            No negative marking
                          </span>
                        )}
                        {assign.allowRetake && (
                          <span className="assignment-badge-tag assignment-badge-retake">
                            Retakes allowed
                          </span>
                        )}
                      </div>

                      <h3 className="assignment-title">
                        {assign.title}
                      </h3>

                      {assign.description && (
                        <p className="assignment-description">
                          {assign.description}
                        </p>
                      )}

                      {/* Real Deadline displayed in Red */}
                      <div className="assignment-deadline">
                        <span>Deadline:</span>
                        <span>{formatDateTimeDisplay(assign.endDate)}</span>
                      </div>
                    </div>

                    <div className="assignment-card-footer">
                      {!isTeacher ? (
                        /* Student Card Actions */
                        <div>
                          {assign.userSubmission ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div className="assignment-score">
                                Score: {assign.userSubmission.score} / {assign.totalMarks} ({assign.userSubmission.percentage}%)
                                {assign.attemptCount > 1 && (
                                  <div style={{ fontSize: '0.75rem', fontWeight: 500, marginTop: '0.2rem' }}>
                                    (Best of {assign.attemptCount} attempts)
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenStudentResult(assign._id)}
                                  className="assignment-view-btn"
                                >
                                  <Eye size={14} />
                                  <span>View Result</span>
                                </button>

                                {assign.canRetake && (
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/exam/${assign._id}`)}
                                    className="assignment-start-btn"
                                    style={{ flex: 1, padding: '0.5rem' }}
                                  >
                                    Retake Exam
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : isDeadlinePassed ? (
                            <div className="assignment-review-locked-btn" style={{ textAlign: 'center' }}>
                              Examination Closed (Deadline Passed)
                            </div>
                          ) : (
                            <button
                              onClick={() => navigate(`/exam/${assign._id}`)}
                              className="assignment-start-btn"
                            >
                              Start Test Now
                            </button>
                          )}
                        </div>
                      ) : (
                        /* Teacher Card Actions */
                        <div className="assignment-teacher-actions">
                          {isDeadlinePassed ? (
                            <button
                              onClick={() => handleOpenReview(assign)}
                              className="assignment-view-btn"
                              title="Review student submissions"
                            >
                              <Eye size={14} />
                              <span>Submissions ({assign.submissionCount ?? 0})</span>
                            </button>
                          ) : (
                            <div
                              className="assignment-review-locked-btn"
                              title="Submissions and answer release are accessible once the deadline has passed."
                            >
                              <Lock size={12} />
                              <span>Review (After Deadline)</span>
                            </div>
                          )}

                          <button
                            onClick={() => handleOpenEdit(assign._id)}
                            className="assignment-edit-btn"
                            title="Edit examination"
                            aria-label="Edit examination"
                          >
                            <Edit3 size={15} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteAssignment(assign._id)}
                            className="assignment-delete-btn"
                            title="Delete examination"
                            aria-label="Delete examination"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================
              Create Assignment Modal
             ======================================================== */}
          {showCreateModal && (
            <div className="assignment-modal-overlay">
              <div className="assignment-modal">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="assignment-modal-close"
                  type="button"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>

                <h2 className="assignment-modal-heading">
                  Create MCQ Examination
                </h2>

                {createError && (
                  <div className="datetime-error-msg" style={{ marginBottom: '1rem' }}>
                    {createError}
                  </div>
                )}

                <form onSubmit={handleCreateAssignment}>
                  {/* Basic Details: Title & Duration */}
                  <div className="assignment-form-grid">
                    <div>
                      <label className="assignment-form-label" htmlFor="create-title">
                        Title *
                      </label>
                      <input
                        id="create-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="e.g. Midterm Physics Examination"
                        className="assignment-form-input"
                      />
                    </div>

                    <div>
                      <label className="assignment-form-label" htmlFor="create-duration">
                        Duration (Minutes) *
                      </label>
                      <input
                        id="create-duration"
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                        className="assignment-form-input"
                      />
                    </div>
                  </div>

                  {/* Task 1: Examination Description */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="assignment-form-label" htmlFor="create-desc">
                      Examination Description &amp; Instructions
                    </label>
                    <textarea
                      id="create-desc"
                      rows={3}
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="Provide test instructions, topics covered, or calculator permissions..."
                      className="assignment-form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Task 4 & 5: Marks Per Question & Negative Marking */}
                  <div className="assignment-form-grid">
                    <div>
                      <label className="assignment-form-label" htmlFor="create-marks">
                        Marks per question *
                      </label>
                      <input
                        id="create-marks"
                        type="number"
                        step="any"
                        min="0.01"
                        value={marksPerQuestion}
                        onChange={(e) => setMarksPerQuestion(e.target.value)}
                        required
                        className="assignment-form-input"
                      />
                    </div>

                    <div>
                      <label className="assignment-form-label" htmlFor="create-neg-marks">
                        Negative marks per wrong answer
                      </label>
                      <input
                        id="create-neg-marks"
                        type="number"
                        step="any"
                        min="0"
                        value={negativeMarks}
                        onChange={(e) => setNegativeMarks(e.target.value)}
                        placeholder="0 for none, or 0.25, 0.33, etc."
                        className="assignment-form-input"
                      />
                    </div>
                  </div>

                  {/* Task 3: Retake Examination Checkbox */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={allowRetake}
                        onChange={(e) => setAllowRetake(e.target.checked)}
                        style={{ width: 17, height: 17 }}
                      />
                      <span>Allow students to retake this examination</span>
                    </label>
                  </div>

                  {/* Task 2: Confirmed Date/Time Pickers */}
                  <div className="assignment-form-grid">
                    <DateTimePicker
                      label="Start Date/Time"
                      id="create-start-dt"
                      value={startDate}
                      onChange={setStartDate}
                      required
                    />

                    <DateTimePicker
                      label="End Date/Time (Deadline)"
                      id="create-end-dt"
                      value={endDate}
                      onChange={setEndDate}
                      minDate={startDate}
                      required
                    />
                  </div>

                  {/* Question Builder */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                    <h3 className="assignment-questions-heading" style={{ border: 'none', margin: 0, padding: 0 }}>
                      Questions Builder ({questions.length} questions &bull; Total: {Math.round((questions.length * (Number(marksPerQuestion) || 1)) * 100) / 100} Marks)
                    </h3>
                  </div>

                  {questions.map((q, idx) => (
                    <div key={idx} className="assignment-question-card" style={{ marginTop: '0.75rem' }}>
                      <div className="assignment-question-header">
                        <span>Question #{idx + 1}</span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="assignment-remove-question"
                            aria-label={`Remove question ${idx + 1}`}
                          >
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
                        className="assignment-question-input"
                      />

                      <div className="assignment-options-grid">
                        <input
                          type="text"
                          placeholder="Option A"
                          value={q.optionA}
                          onChange={(e) => handleQuestionChange(idx, 'optionA', e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Option B"
                          value={q.optionB}
                          onChange={(e) => handleQuestionChange(idx, 'optionB', e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Option C"
                          value={q.optionC}
                          onChange={(e) => handleQuestionChange(idx, 'optionC', e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Option D"
                          value={q.optionD}
                          onChange={(e) => handleQuestionChange(idx, 'optionD', e.target.value)}
                          required
                        />
                      </div>

                      <div className="assignment-correct-option">
                        <label>Correct Option:</label>
                        <select
                          value={q.correctOption}
                          onChange={(e) => handleQuestionChange(idx, 'correctOption', e.target.value)}
                        >
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddQuestionField}
                    className="assignment-add-question"
                  >
                    + Add Another Question
                  </button>

                  {/* Modal Actions */}
                  <div className="assignment-modal-actions">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="assignment-cancel-btn"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="assignment-publish-btn"
                    >
                      Publish Test
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================
              Task 6: Edit Examination Modal (Teacher)
             ======================================================== */}
          {showEditModal && (
            <div className="assignment-modal-overlay">
              <div className="assignment-modal">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="assignment-modal-close"
                  type="button"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>

                <h2 className="assignment-modal-heading">
                  Edit MCQ Examination
                </h2>

                {editHasSubmissions && (
                  <div className="assignment-locked-banner">
                    <strong>Locked Marking Scheme:</strong> Student attempts have already been submitted for this examination. Question statements, options, correct answers, and marking rules are locked to preserve historical academic grading. You may update Title, Description, Schedule, Duration, and Retake settings.
                  </div>
                )}

                {editError && (
                  <div className="datetime-error-msg" style={{ marginBottom: '1rem' }}>
                    {editError}
                  </div>
                )}

                <form onSubmit={handleSaveEdit}>
                  <div className="assignment-form-grid">
                    <div>
                      <label className="assignment-form-label" htmlFor="edit-title">
                        Title *
                      </label>
                      <input
                        id="edit-title"
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                        className="assignment-form-input"
                      />
                    </div>

                    <div>
                      <label className="assignment-form-label" htmlFor="edit-duration">
                        Duration (Minutes) *
                      </label>
                      <input
                        id="edit-duration"
                        type="number"
                        min="1"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        required
                        className="assignment-form-input"
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="assignment-form-label" htmlFor="edit-desc">
                      Examination Description &amp; Instructions
                    </label>
                    <textarea
                      id="edit-desc"
                      rows={3}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="assignment-form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div className="assignment-form-grid">
                    <div>
                      <label className="assignment-form-label" htmlFor="edit-marks">
                        Marks per question
                      </label>
                      <input
                        id="edit-marks"
                        type="number"
                        step="any"
                        min="0.01"
                        value={editMarksPerQuestion}
                        disabled={editHasSubmissions}
                        onChange={(e) => setEditMarksPerQuestion(e.target.value)}
                        className="assignment-form-input"
                      />
                    </div>

                    <div>
                      <label className="assignment-form-label" htmlFor="edit-neg-marks">
                        Negative marks per wrong answer
                      </label>
                      <input
                        id="edit-neg-marks"
                        type="number"
                        step="any"
                        min="0"
                        value={editNegativeMarks}
                        disabled={editHasSubmissions}
                        onChange={(e) => setEditNegativeMarks(e.target.value)}
                        className="assignment-form-input"
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={editAllowRetake}
                        onChange={(e) => setEditAllowRetake(e.target.checked)}
                        style={{ width: 17, height: 17 }}
                      />
                      <span>Allow students to retake this examination</span>
                    </label>
                  </div>

                  <div className="assignment-form-grid">
                    <DateTimePicker
                      label="Start Date/Time"
                      id="edit-start-dt"
                      value={editStartDate}
                      onChange={setEditStartDate}
                      required
                    />

                    <DateTimePicker
                      label="End Date/Time (Deadline)"
                      id="edit-end-dt"
                      value={editEndDate}
                      onChange={setEditEndDate}
                      minDate={editStartDate}
                      required
                    />
                  </div>

                  {/* Questions Section */}
                  <h3 className="assignment-questions-heading">
                    Questions ({editQuestions.length})
                  </h3>

                  {editQuestions.map((q, idx) => (
                    <div key={idx} className="assignment-question-card">
                      <div className="assignment-question-header">
                        <span>Question #{idx + 1}</span>
                        {!editHasSubmissions && editQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleEditRemoveQuestion(idx)}
                            className="assignment-remove-question"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Question Statement..."
                        value={q.questionText}
                        disabled={editHasSubmissions}
                        onChange={(e) => handleEditQuestionChange(idx, 'questionText', e.target.value)}
                        required
                        className="assignment-question-input"
                      />

                      <div className="assignment-options-grid">
                        <input
                          type="text"
                          placeholder="Option A"
                          value={q.optionA}
                          disabled={editHasSubmissions}
                          onChange={(e) => handleEditQuestionChange(idx, 'optionA', e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Option B"
                          value={q.optionB}
                          disabled={editHasSubmissions}
                          onChange={(e) => handleEditQuestionChange(idx, 'optionB', e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Option C"
                          value={q.optionC}
                          disabled={editHasSubmissions}
                          onChange={(e) => handleEditQuestionChange(idx, 'optionC', e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Option D"
                          value={q.optionD}
                          disabled={editHasSubmissions}
                          onChange={(e) => handleEditQuestionChange(idx, 'optionD', e.target.value)}
                          required
                        />
                      </div>

                      <div className="assignment-correct-option">
                        <label>Correct Option:</label>
                        <select
                          value={q.correctOption}
                          disabled={editHasSubmissions}
                          onChange={(e) => handleEditQuestionChange(idx, 'correctOption', e.target.value)}
                        >
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  {!editHasSubmissions && (
                    <button
                      type="button"
                      onClick={handleEditAddQuestion}
                      className="assignment-add-question"
                    >
                      + Add Another Question
                    </button>
                  )}

                  <div className="assignment-modal-actions">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="assignment-cancel-btn"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={editSaving}
                      className="assignment-publish-btn"
                    >
                      {editSaving ? 'Saving Changes...' : 'Save Examination Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================
              Task 8: Review Student Submissions Modal (Teacher)
             ======================================================== */}
          {showReviewModal && (
            <div className="assignment-modal-overlay">
              <div className="assignment-modal submissions-modal">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="assignment-modal-close"
                  type="button"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>

                <div className="submissions-header-bar">
                  <div>
                    <h2 style={{ margin: '0 0 0.25rem' }}>
                      {reviewAssignment?.title} &mdash; Student Submissions
                    </h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                      Deadline passed: {formatDateTimeDisplay(reviewAssignment?.endDate)} &bull; {reviewSubmissions.length} submission{reviewSubmissions.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  {/* Teacher-Controlled Answer Release Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleReleaseAnswers}
                    disabled={togglingRelease}
                    className={`release-answers-toggle-btn ${reviewAssignment?.answersReleased ? 'released' : 'hidden'}`}
                  >
                    {reviewAssignment?.answersReleased ? (
                      <>
                        <Unlock size={16} />
                        <span>Answers Released to Students (Click to Hide)</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>Release Correct Answers to Students</span>
                      </>
                    )}
                  </button>
                </div>

                {reviewLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>Loading student submissions...</div>
                ) : reviewSubmissions.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No students submitted this examination before the deadline.
                  </div>
                ) : (
                  <div>
                    <table className="submissions-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Attempt</th>
                          <th>Score</th>
                          <th>Percentage</th>
                          <th>Breakdown (C / W / U)</th>
                          <th>Submitted</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewSubmissions.map((s) => (
                          <React.Fragment key={s._id}>
                            <tr>
                              <td>
                                <strong>{s.student?.name}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.student?.email}</div>
                              </td>
                              <td>#{s.attemptNumber || 1}</td>
                              <td>{s.score} / {s.maxMarks || reviewAssignment?.totalMarks}</td>
                              <td><strong>{s.percentage}%</strong></td>
                              <td>
                                <span style={{ color: '#16a34a' }}>{s.correctCount || 0}</span> /{' '}
                                <span style={{ color: '#dc2626' }}>{s.incorrectCount || 0}</span> /{' '}
                                <span style={{ color: '#64748b' }}>{s.unansweredCount || 0}</span>
                              </td>
                              <td style={{ fontSize: '0.8rem' }}>{new Date(s.submittedAt).toLocaleString()}</td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => setExpandedStudentId(expandedStudentId === s._id ? null : s._id)}
                                  className="assignment-edit-btn"
                                  style={{ padding: '0.35rem 0.65rem' }}
                                >
                                  {expandedStudentId === s._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  <span>{expandedStudentId === s._id ? 'Hide' : 'Inspect'}</span>
                                </button>
                              </td>
                            </tr>

                            {expandedStudentId === s._id && (
                              <tr>
                                <td colSpan={7} style={{ background: '#f8fafc', padding: '1rem' }}>
                                  <div className="submission-inspect-box">
                                    <h4 style={{ margin: '0 0 0.75rem' }}>
                                      Student Answers Breakdown &mdash; {s.student?.name} (Attempt #{s.attemptNumber || 1})
                                    </h4>

                                    {s.answers?.map((ans, aIdx) => {
                                      const q = ans.question;
                                      if (!q) return null;
                                      return (
                                        <div key={q._id || aIdx} className="answer-card">
                                          <div style={{ fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                                            Q{aIdx + 1}. {q.questionText}
                                          </div>

                                          {['A', 'B', 'C', 'D'].map((opt) => {
                                            const isStudentSelected = ans.selectedOption === opt;
                                            const isCorrectKey = q.correctOption === opt;
                                            let cls = '';
                                            if (isCorrectKey) cls = 'correct-key';
                                            else if (isStudentSelected && !ans.isCorrect) cls = 'student-wrong';

                                            return (
                                              <div key={opt} className={`answer-option-row ${cls}`}>
                                                <span>
                                                  <strong>{opt}:</strong> {q[`option${opt}`]}
                                                </span>
                                                <span>
                                                  {isStudentSelected && (
                                                    <span style={{ fontSize: '0.75rem', marginRight: '0.4rem', fontWeight: 'bold' }}>
                                                      [Student's Choice]
                                                    </span>
                                                  )}
                                                  {isCorrectKey && <span style={{ color: '#16a34a' }}>&#10003; Correct Key</span>}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="assignment-modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="assignment-publish-btn"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              Student Result & Answer Key Modal
             ======================================================== */}
          {showStudentResultModal && (
            <div className="assignment-modal-overlay">
              <div className="assignment-modal submissions-modal">
                <button
                  onClick={() => setShowStudentResultModal(false)}
                  className="assignment-modal-close"
                  type="button"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>

                {studentResultLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>Loading result...</div>
                ) : (
                  <div>
                    <h2 style={{ margin: '0 0 0.5rem' }}>
                      {studentResultData?.assignment?.title} &mdash; Result
                    </h2>

                    {/* Best Score Summary Banner */}
                    <div className="assignment-score" style={{ padding: '1rem', marginBottom: '1.25rem', fontSize: '1.1rem' }}>
                      Best Score: {studentResultData?.bestSubmission?.score} / {studentResultData?.assignment?.totalMarks} ({studentResultData?.bestSubmission?.percentage}%)
                    </div>

                    {/* Attempts History */}
                    {studentResultData?.submissions?.length > 1 && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem' }}>Your Submission Attempts:</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {studentResultData.submissions.map((sub) => (
                            <div
                              key={sub._id}
                              style={{
                                padding: '0.5rem 0.75rem',
                                border: '1px solid #cbd5e1',
                                borderRadius: 6,
                                background: sub._id === studentResultData.bestSubmission?._id ? '#f0fdf4' : '#fff',
                                fontSize: '0.82rem'
                              }}
                            >
                              <strong>Attempt #{sub.attemptNumber || 1}:</strong> {sub.score} marks ({sub.percentage}%)
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {new Date(sub.submittedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Answer Key Release Notice / Content */}
                    {!studentResultData?.answersReleased ? (
                      <div className="assignment-locked-banner" style={{ background: '#eff6ff', borderColor: '#bfdbfe', borderLeftColor: '#3b82f6', color: '#1e40af' }}>
                        <strong>Answer Key Confidential:</strong> The teacher has not yet released the answer key for this examination. Correct answers will become visible here once the teacher releases them after the deadline.
                      </div>
                    ) : (
                      <div>
                        <h3 style={{ margin: '1rem 0 0.75rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle size={18} />
                          <span>Official Answer Key &amp; Question Review</span>
                        </h3>

                        {studentResultData?.questions?.map((q, idx) => {
                          const latestSub = studentResultData.submissions?.[0];
                          const studentAns = latestSub?.answers?.find((a) => (a.question?._id || a.question) === q._id);
                          const chosen = studentAns?.selectedOption;
                          const isMatch = chosen === q.correctOption;

                          return (
                            <div key={q._id} className="answer-card">
                              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                                Q{idx + 1}. {q.questionText}
                              </div>

                              {['A', 'B', 'C', 'D'].map((letter) => {
                                const isCorrect = q.correctOption === letter;
                                const isChosen = chosen === letter;
                                let rowClass = '';
                                if (isCorrect) rowClass = 'correct-key';
                                else if (isChosen && !isMatch) rowClass = 'student-wrong';

                                return (
                                  <div key={letter} className={`answer-option-row ${rowClass}`}>
                                    <span>
                                      <strong>{letter}:</strong> {q[`option${letter}`]}
                                    </span>
                                    <span>
                                      {isChosen && <span style={{ marginRight: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold' }}>[Your Choice]</span>}
                                      {isCorrect && <span style={{ color: '#16a34a' }}>&#10003; Correct Key</span>}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="assignment-modal-actions" style={{ marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowStudentResultModal(false)}
                        className="assignment-publish-btn"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AssignmentsPage;
