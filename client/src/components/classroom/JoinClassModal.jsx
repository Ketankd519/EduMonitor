import { useState } from 'react';
import Modal from '../common/Modal';
import FormInput from '../common/FormInput';
import Button from '../common/Button';
import Alert from '../common/Alert';

export default function JoinClassModal({ onClose, onJoined }) {
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!classCode.trim()) {
      setError('Please enter a class code');
      return;
    }

    setLoading(true);
    try {
      await onJoined(classCode.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Join Class" onClose={onClose}>
      <Alert type="error" message={error} />
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Enter Class Code"
          name="classCode"
          value={classCode}
          onChange={(e) => setClassCode(e.target.value)}
          placeholder="e.g. MC0004_A"
          autoFocus
        />
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Join
          </Button>
        </div>
      </form>
    </Modal>
  );
}
