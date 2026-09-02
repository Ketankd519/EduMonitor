import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

const ExamView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: 'A' }
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExamData();
  }, [id]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmitExam(); // Auto-submit when time expires
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchExamData = async () => {
    try {
      const res = await API.get(`/assignments/${id}`);
      if (res.data.userSubmission) {
        alert('You have already completed this examination.');
        return navigate('/assignments');
      }

      setAssignment(res.data.assignment);
      setQuestions(res.data.questions || []);
      setTimeLeft(res.data.assignment.durationMinutes * 60);
    } catch (err) {
      alert('Failed to load examination paper.');
      navigate('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId, optionKey) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: optionKey });
  };

  const handleSubmitExam = async () => {
    if (submitting) return;
    setSubmitting(true);

    const answersPayload = Object.keys(selectedAnswers).map((qId) => ({
      questionId: qId,
      selectedOption: selectedAnswers[qId]
    }));

    try {
      await API.post('/submissions', {
        assignmentId: id,
        answers: answersPayload
      });
      alert('Examination submitted successfully!');
      navigate('/assignments');
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Exam Paper...</div>;
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header Bar with Countdown Timer */}
        <div style={{ background: '#fff', padding: '1.25rem 2rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '1rem', zIndex: 100, marginBottom: '2rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{assignment?.title}</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Questions: {questions.length}</span>
          </div>

          <div style={{ background: '#fee2e2', color: 'var(--danger-red)', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <Clock size={20} />
            <span>Time Left: {formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          {questions.map((q, idx) => (
            <div key={q._id} style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', color: 'var(--text-dark)' }}>
                Q{idx + 1}. {q.questionText}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['A', 'B', 'C', 'D'].map((optKey) => (
                  <label
                    key={optKey}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: selectedAnswers[q._id] === optKey ? '#dbeafe' : '#fafafa',
                      cursor: 'pointer',
                      fontWeight: selectedAnswers[q._id] === optKey ? 'bold' : 'normal'
                    }}
                  >
                    <input
                      type="radio"
                      name={`question_${q._id}`}
                      checked={selectedAnswers[q._id] === optKey}
                      onChange={() => handleOptionSelect(q._id, optKey)}
                    />
                    <span>{q[`option${optKey}`]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmitExam}
          disabled={submitting}
          style={{ width: '100%', background: 'var(--academic-green)', color: '#fff', border: 'none', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}
        >
          {submitting ? 'Evaluating Submission...' : 'Submit Examination'}
        </button>
      </div>
    </div>
  );
};

export default ExamView;