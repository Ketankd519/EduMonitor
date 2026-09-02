import { useState } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { updateAcademicRecord } from '../../api/academicRecordApi';

const MARK_FIELDS = [
  { key: 'assignmentMarks', label: 'Assignment Marks' },
  { key: 'internalMarks', label: 'Internal Marks' },
  { key: 'examMarks', label: 'Exam Marks' },
  { key: 'incentiveMarks', label: 'Incentive Marks' },
  { key: 'mcqMarks', label: 'MCQ Marks' },
  { key: 'otherMarks', label: 'Other Marks' },
];

export default function EditRecordModal({ record, onClose, onSaved }) {
  const [form, setForm] = useState({
    rollNumber: record.rollNumber || '',
    semester: record.semester || '',
    assignmentMarks: record.assignmentMarks,
    internalMarks: record.internalMarks,
    examMarks: record.examMarks,
    incentiveMarks: record.incentiveMarks,
    mcqMarks: record.mcqMarks,
    otherMarks: record.otherMarks,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const liveOverall = MARK_FIELDS.reduce((sum, f) => sum + (Number(form[f.key]) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await updateAcademicRecord(record._id, form);
      onSaved(res.data.data.record);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit Record — ${record.student.fullName}`} onClose={onClose}>
      <Alert type="error" message={error} />
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <FormInput label="Roll Number" name="rollNumber" value={form.rollNumber} onChange={handleChange} />
          <FormInput label="Semester" name="semester" value={form.semester} onChange={handleChange} />
        </div>

        <div className="marks-form-grid">
          {MARK_FIELDS.map((f) => (
            <FormInput
              key={f.key}
              label={f.label}
              name={f.key}
              type="number"
              min="0"
              value={form[f.key]}
              onChange={handleChange}
            />
          ))}
        </div>

        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 1rem' }}>
          Overall Marks: <strong>{liveOverall}</strong> (calculated automatically)
        </p>

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
