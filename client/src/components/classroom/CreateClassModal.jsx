import { useState } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import Button from '../common/Button';
import Alert from '../common/Alert';

export default function CreateClassModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ subjectTitle: '', subjectCode: '', section: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.subjectTitle.trim() || !form.subjectCode.trim() || !form.section.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      await onCreated(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create Class" onClose={onClose}>
      <Alert type="error" message={error} />
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Subject/Course Title"
          name="subjectTitle"
          value={form.subjectTitle}
          onChange={handleChange}
          placeholder="e.g. Java Programming"
          autoFocus
        />
        <FormInput
          label="Subject Code"
          name="subjectCode"
          value={form.subjectCode}
          onChange={handleChange}
          placeholder="e.g. MC0004"
        />
        <FormInput
          label="Section"
          name="section"
          value={form.section}
          onChange={handleChange}
          placeholder="e.g. A"
        />
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
