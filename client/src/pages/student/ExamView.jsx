import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { Clock, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import './style.css';

const ExamView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    fetchExamData();
  }, [id]);

  useEffect(() => {
    if (timeLeft === null || submissionResult) return;

    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submissionResult]);

  const fetchExamData = async () => {
    try {
      const res = await API.get(`/assignments/${id}`);

      // If already completed and cannot retake
      if (res.data.alreadyCompleted && !res.data.canRetake) {
        alert('You have already completed this examination and retakes are not allowed.');
        return navigate('/assignments');
      }

      setAssignment(res.data.assignment);
      setQuestions(res.data.questions || []);
      setTimeLeft(res.data.assignment.durationMinutes * 60);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load examination paper.');
      navigate('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId, optionKey) => {
    setSelectedAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: optionKey,
    }));
  };

  const handleSubmitExam = async () => {
    if (submitting) return;

    setSubmitting(true);

    const answersPayload = questions.map((q) => ({
      questionId: q._id,
      selectedOption: selectedAnswers[q._id] || null,
    }));

    try {
      const res = await API.post('/submissions', {
        assignmentId: id,
        answers: answersPayload,
      });

      setSubmissionResult(res.data.submission);
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed.');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (loading) {
    return (
      <div className="exam-loading">
        <div className="exam-loading-spinner" />
        <p>Loading Exam Paper...</p>
      </div>
    );
  }

  // --- Submission Result Screen ---
  if (submissionResult) {
    return (
      <div className="exam-page">
        <div className="exam-container" style={{ maxWidth: 650 }}>
          <div className="exam-question-card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: '#dcfce7', borderRadius: '50%', marginBottom: '1rem' }}>
              <CheckCircle size={48} color="#16a34a" />
            </div>

            <h2 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>
              Examination Submitted Successfully
            </h2>

            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {assignment?.title} &bull; Attempt #{submissionResult.attemptNumber || 1}
            </p>

            {/* Score Banner */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.3rem' }}>Total Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e3a8a' }}>
                {submissionResult.score} <span style={{ fontSize: '1.25rem', color: '#94a3b8' }}>/ {submissionResult.maxMarks}</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#16a34a', marginTop: '0.25rem' }}>
                {submissionResult.percentage}%
              </div>
            </div>

            {/* Performance Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#16a34a' }}>
                  {submissionResult.correctCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 500 }}>Correct</div>
              </div>

              <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: 8, border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#dc2626' }}>
                  {submissionResult.incorrectCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 500 }}>Incorrect</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#64748b' }}>
                  {submissionResult.unansweredCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>Unanswered</div>
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.85rem', color: '#1e40af', fontSize: '0.85rem', marginBottom: '1.75rem', textAlign: 'left' }}>
              <strong>Answer Key Confidential:</strong> The official question-by-question answer key will be released by the teacher after the examination deadline has passed. You can review your results from the Assignments page.
            </div>

            <button
              type="button"
              onClick={() => navigate('/assignments')}
              className="exam-submit-btn"
            >
              Return to Assignments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).filter((k) => selectedAnswers[k]).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="exam-page">
      <div className="exam-container">
        {/* Header and Countdown Timer */}
        <header className="exam-header">
          <div className="exam-header-info">
            <h2 className="exam-title">{assignment?.title}</h2>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              <span className="exam-question-count">
                Total Questions: {questions.length}
              </span>
              <span className="exam-question-count">
                Marks/Q: +{assignment?.marksPerQuestion ?? 1}
              </span>
              {assignment?.negativeMarks > 0 && (
                <span className="exam-question-count" style={{ color: '#dc2626' }}>
                  Penalty/Wrong: -{assignment.negativeMarks}
                </span>
              )}
            </div>
          </div>

          <div
            className={`exam-timer ${
              timeLeft !== null && timeLeft <= 60
                ? 'exam-timer--urgent'
                : ''
            }`}
            role="timer"
            aria-live="off"
          >
            <Clock size={20} />
            <span>Time Left: {formatTime(timeLeft ?? 0)}</span>
          </div>
        </header>

        {/* Task 1: Examination Instructions / Description */}
        {assignment?.description && (
          <div style={{
            background: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '0.95rem' }}>
              Instructions &amp; Description
            </h4>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {assignment.description}
            </p>
          </div>
        )}

        {/* Progress Tracker */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          padding: '0.75rem 1.25rem',
          borderRadius: 8,
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem'
        }}>
          <span>Answered: <strong style={{ color: '#16a34a' }}>{answeredCount}</strong></span>
          <span>Unanswered: <strong style={{ color: '#dc2626' }}>{unansweredCount}</strong></span>
          <span>Total: <strong>{questions.length}</strong></span>
        </div>

        {/* Questions */}
        <div className="exam-questions">
          {questions.map((q, idx) => (
            <section key={q._id} className="exam-question-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                <span>Question {idx + 1} of {questions.length}</span>
                <span>+{assignment?.marksPerQuestion ?? 1} marks</span>
              </div>

              <h3 className="exam-question-title">
                {q.questionText}
              </h3>

              <div className="exam-options">
                {['A', 'B', 'C', 'D'].map((optKey) => {
                  const isSelected = selectedAnswers[q._id] === optKey;

                  return (
                    <label
                      key={optKey}
                      className={`exam-option ${
                        isSelected ? 'exam-option--selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question_${q._id}`}
                        value={optKey}
                        checked={isSelected}
                        onChange={() =>
                          handleOptionSelect(q._id, optKey)
                        }
                      />

                      <span className="exam-option-letter">
                        {optKey}
                      </span>

                      <span className="exam-option-text">
                        {q[`option${optKey}`]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Submit */}
        <button
          className="exam-submit-btn"
          onClick={handleSubmitExam}
          disabled={submitting}
        >
          {submitting ? 'Evaluating Submission...' : 'Submit Examination'}
        </button>
      </div>
    </div>
  );
};

export default ExamView;
