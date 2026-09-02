import { useState } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import Button from '../common/Button';
import Alert from '../common/Alert';

const ACCEPTED = '.pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png';

export default function NoteUploadModal({ onClose, onUploaded }) {
  const [form, setForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please choose a file to upload');
      return;
    }
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    try {
      await onUploaded({ file, ...form });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload the file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Upload Note" onClose={onClose}>
      <Alert type="error" message={error} />
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Title"
          name="title"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Unit 3 Slides"
          autoFocus
        />
        <FormInput
          label="Description"
          name="description"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Optional"
        />
        <div className="form-field">
          <label className="form-label">File (PDF, PPT/PPTX, DOC/DOCX, or image)</label>
          <input
            type="file"
            accept={ACCEPTED}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="form-input"
          />
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Upload
          </Button>
        </div>
      </form>
    </Modal>
  );
}
