import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignmentById } from '../../api/assignmentApi';
import { submitAssignment, getMySubmission } from '../../api/submissionApi';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import '../../styles/classroom.css';

export default function AssignmentTake() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [canRetake, setCanRetake] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAssignmentById(assignmentId)
      .then((res) => {
        if (cancelled) return;
        const data = res.data.data;
        setAssignment(data.assignment);
        setAlreadySubmitted(data.alreadySubmitted);
        setCanRetake(data.canRetake);

        if (data.alreadySubmitted) {
          return getMySubmission(assignmentId).then((r) => {
            if (!cancelled) setSubmission(r.data.data.submission);
          });
        }
        setSecondsLeft(data.assignment.durationMinutes * 60);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load this assignment.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));
      const res = await submitAssignment(assignmentId, payload);
      setSubmission(res.data.data.submission);
      setAlreadySubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit assignment.');
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, assignmentId, submitting]);

  // Countdown timer — auto-submits when it hits zero
  useEffect(() => {
    if (secondsLeft === null || alreadySubmitted) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, alreadySubmitted, handleSubmit]);

  if (loading) return <Loader label="Loading assignment..." />;
  if (error && !assignment) return <EmptyState message={error} />;

  if (alreadySubmitted && submission) {
    return <ResultView assignment={assignment} submission={submission} onBack={() => navigate(-1)} />;
  }

  if (alreadySubmitted && !canRetake) {
    return (
      <EmptyState message="You have already submitted this assignment and retakes are not allowed." />
    );
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isLow = secondsLeft <= 60;

  return (
    <div>
      <h1 className="dashboard-welcome">{assignment.title}</h1>
      {assignment.description && <p className="dashboard-subtitle">{assignment.description}</p>}

      <div className="mcq-timer">
        <span>Time Remaining</span>
        <span className={`mcq-timer-value${isLow ? ' low' : ''}`}>
          {mins}:{String(secs).padStart(2, '0')}
        </span>
      </div>

      <Alert type="error" message={error} />

      {assignment.questions.map((q, idx) => (
        <div className="mcq-question-card" key={q._id}>
          <div className="mcq-question-number">
            Question {idx + 1} of {assignment.questions.length} &middot; {q.marks} mark{q.marks === 1 ? '' : 's'}
          </div>
          <div className="mcq-question-text">{q.questionText}</div>
          {['A', 'B', 'C', 'D'].map((letter) => (
            <label
              key={letter}
              className={`mcq-option-label${answers[q._id] === letter ? ' selected' : ''}`}
            >
              <input
                type="radio"
                name={q._id}
                checked={answers[q._id] === letter}
                onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: letter }))}
              />
              {q[`option${letter}`]}
            </label>
          ))}
        </div>
      ))}

      <Button type="button" loading={submitting} onClick={handleSubmit} style={{ width: 'auto', padding: '0.7rem 2rem' }}>
        Submit Assignment
      </Button>
    </div>
  );
}

function ResultView({ assignment, submission, onBack }) {
  return (
    <div>
      <h1 className="dashboard-welcome">{assignment.title} — Result</h1>

      <div className="result-summary-card">
        <div className="result-score">
          {submission.score} / {submission.totalMarks}
        </div>
        <div className="result-percentage">{submission.percentage}%</div>
        <div className="result-breakdown">
          <div className="result-breakdown-item">
            <div className="result-breakdown-value" style={{ color: '#16a34a' }}>
              {submission.correctCount}
            </div>
            <div className="result-breakdown-label">Correct</div>
          </div>
          <div className="result-breakdown-item">
            <div className="result-breakdown-value" style={{ color: '#dc2626' }}>
              {submission.incorrectCount}
            </div>
            <div className="result-breakdown-label">Incorrect</div>
          </div>
          <div className="result-breakdown-item">
            <div className="result-breakdown-value" style={{ color: '#94a3b8' }}>
              {submission.unansweredCount}
            </div>
            <div className="result-breakdown-label">Unanswered</div>
          </div>
        </div>
      </div>

      <h2 className="section-title">Review</h2>
      {submission.answers.map((a, idx) => {
        const q = a.question;
        if (!q) return null;
        return (
          <div className="mcq-question-card" key={q._id}>
            <div className="mcq-question-number">Question {idx + 1}</div>
            <div className="mcq-question-text">{q.questionText}</div>
            {['A', 'B', 'C', 'D'].map((letter) => {
              let cls = '';
              if (letter === q.correctAnswer) cls = 'correct';
              else if (letter === a.selectedOption && !a.isCorrect) cls = 'incorrect';
              return (
                <div className={`mcq-option-label ${cls}`} key={letter}>
                  {q[`option${letter}`]}
                  {letter === q.correctAnswer && ' ✓'}
                </div>
              );
            })}
          </div>
        );
      })}

      <Button type="button" variant="secondary" onClick={onBack} style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>
        Back
      </Button>
    </div>
  );
}
