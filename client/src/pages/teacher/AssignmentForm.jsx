import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createAssignment, updateAssignment, getAssignmentById } from '../../api/assignmentApi';
import QuestionBuilder, { emptyQuestion } from '../../components/assignment/QuestionBuilder';
import FormInput from '../../components/common/FormInput';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Loader from '../../components/common/Loader';

/**
 * Handles both create and edit. Create: /teacher/classes/:classId/assignments/new
 * Edit: /teacher/assignments/:assignmentId/edit
 */
export default function AssignmentForm() {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!assignmentId;

  const [form, setForm] = useState({
    title: '',
    description: '',
    durationMinutes: 30,
    startDate: '',
    endDate: '',
    allowRetake: false,
  });
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [resolvedClassId, setResolvedClassId] = useState(classId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    getAssignmentById(assignmentId)
      .then((res) => {
        const a = res.data.data.assignment;
        setResolvedClassId(a.class);
        setForm({
          title: a.title,
          description: a.description,
          durationMinutes: a.durationMinutes,
          startDate: toDatetimeLocal(a.startDate),
          endDate: toDatetimeLocal(a.endDate),
          allowRetake: a.allowRetake,
        });
        setQuestions(
          a.questions.map((q) => ({
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            marks: q.marks,
          }))
        );
      })
      .catch(() => setError('Could not load this assignment.'))
      .finally(() => setLoading(false));
  }, [assignmentId, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.startDate || !form.endDate) {
      setError('Title, start date, and end date are all required');
      return;
    }
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      setError('End date must be after start date');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, questions };
      if (isEdit) {
        await updateAssignment(assignmentId, payload);
        navigate(`/teacher/classes/${resolvedClassId}`);
      } else {
        await createAssignment(classId, payload);
        navigate(`/teacher/classes/${classId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save assignment.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading assignment..." />;

  return (
    <div>
      <h1 className="dashboard-welcome">{isEdit ? 'Edit Assignment' : 'Create Assignment'}</h1>
      <p className="dashboard-subtitle">
        {isEdit
          ? 'Editing questions will reset any existing student submissions for this assignment.'
          : 'Set up an MCQ assignment for your class'}
      </p>

      <Alert type="error" message={error} />

      <form onSubmit={handleSubmit}>
        <div className="profile-card" style={{ maxWidth: '100%', marginBottom: '1.5rem' }}>
          <FormInput label="Title" name="title" value={form.title} onChange={handleChange} />
          <FormInput
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Optional"
          />
          <div className="form-row">
            <FormInput
              label="Duration (minutes)"
              name="durationMinutes"
              type="number"
              min="1"
              value={form.durationMinutes}
              onChange={handleChange}
            />
            <div className="form-field">
              <label className="form-label">
                <input
                  type="checkbox"
                  name="allowRetake"
                  checked={form.allowRetake}
                  onChange={handleChange}
                  style={{ marginRight: '0.4rem' }}
                />
                Allow retake
              </label>
            </div>
          </div>
          <div className="form-row">
            <FormInput
              label="Start Date"
              name="startDate"
              type="datetime-local"
              value={form.startDate}
              onChange={handleChange}
            />
            <FormInput
              label="End Date"
              name="endDate"
              type="datetime-local"
              value={form.endDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <h2 className="section-title" style={{ marginTop: 0 }}>Questions</h2>
        <QuestionBuilder questions={questions} onChange={setQuestions} />

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            type="button"
            variant="secondary"
            style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving} style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>
            {isEdit ? 'Save Changes' : 'Create Assignment'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function toDatetimeLocal(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}
