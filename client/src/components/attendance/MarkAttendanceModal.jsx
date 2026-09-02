import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Loader from '../common/Loader';
import { getAttendanceForDate, markAttendance } from '../../api/attendanceApi';

export default function MarkAttendanceModal({ classId, onClose, onMarked }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadRoster = (d) => {
    setLoading(true);
    getAttendanceForDate(classId, d)
      .then((res) => setRoster(res.data.data.roster))
      .catch(() => setError('Could not load the class roster.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoster(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    loadRoster(newDate);
  };

  const setStatus = (studentId, status) => {
    setRoster((prev) =>
      prev.map((r) => (r.student._id === studentId ? { ...r, status } : r))
    );
  };

  const markAll = (status) => {
    setRoster((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSubmit = async () => {
    setError('');
    const records = roster.filter((r) => r.status).map((r) => ({ studentId: r.student._id, status: r.status }));
    if (records.length === 0) {
      setError('Mark at least one student before saving.');
      return;
    }
    setSaving(true);
    try {
      await markAttendance(classId, date, records);
      onMarked();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Mark Attendance" onClose={onClose}>
      <Alert type="error" message={error} />

      <div className="form-field">
        <label className="form-label">Date</label>
        <input
          type="date"
          className="form-input"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={handleDateChange}
        />
      </div>

      {loading || !roster ? (
        <Loader label="Loading roster..." />
      ) : roster.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No students enrolled in this class yet.</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => markAll('present')}>
              Mark All Present
            </button>
            <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => markAll('absent')}>
              Mark All Absent
            </button>
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {roster.map((r) => (
              <div key={r.student._id} className="student-list-row">
                <div style={{ flex: 1, fontSize: '0.88rem' }}>{r.student.fullName}</div>
                <div className="attendance-status-toggle">
                  <button
                    type="button"
                    className={`attendance-status-btn present${r.status === 'present' ? ' active' : ''}`}
                    onClick={() => setStatus(r.student._id, 'present')}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    className={`attendance-status-btn absent${r.status === 'absent' ? ' active' : ''}`}
                    onClick={() => setStatus(r.student._id, 'absent')}
                  >
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="modal-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" loading={saving} onClick={handleSubmit} disabled={!roster || roster.length === 0}>
          Save Attendance
        </Button>
      </div>
    </Modal>
  );
}
