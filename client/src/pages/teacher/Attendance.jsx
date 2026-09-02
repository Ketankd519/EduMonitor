import { useEffect, useState } from 'react';
import { getMyClasses } from '../../api/classApi';
import { getClassAttendance } from '../../api/attendanceApi';
import ClassPicker from '../../components/common/ClassPicker';
import MarkAttendanceModal from '../../components/attendance/MarkAttendanceModal';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

function pctClass(pct) {
  if (pct === null) return '';
  if (pct >= 75) return 'attendance-pct-high';
  if (pct >= 50) return 'attendance-pct-mid';
  return 'attendance-pct-low';
}

export default function TeacherAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [summaries, setSummaries] = useState(null);
  const [sessionDates, setSessionDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMarkModal, setShowMarkModal] = useState(false);

  useEffect(() => {
    getMyClasses().then((res) => {
      const list = res.data.data.classes;
      setClasses(list);
      if (list.length > 0) setSelectedClassId(list[0]._id);
      else setLoading(false);
    });
  }, []);

  const loadAttendance = (classId) => {
    if (!classId) return;
    setLoading(true);
    getClassAttendance(classId)
      .then((res) => {
        setSummaries(res.data.data.summaries);
        setSessionDates(res.data.data.sessionDates);
      })
      .catch(() => setError('Could not load attendance.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedClassId) loadAttendance(selectedClassId);
  }, [selectedClassId]);

  return (
    <div>
      <h1 className="dashboard-welcome">Attendance</h1>
      <p className="dashboard-subtitle">Track and mark student attendance by class</p>

      {classes.length === 0 && !loading ? (
        <EmptyState message="You haven't created any classes yet." />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
            <ClassPicker classes={classes} selectedId={selectedClassId} onSelect={setSelectedClassId} />
            {selectedClassId && (
              <Button
                type="button"
                onClick={() => setShowMarkModal(true)}
                style={{ width: 'auto', padding: '0.6rem 1.25rem' }}
              >
                Mark Attendance
              </Button>
            )}
          </div>

          {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

          {loading ? (
            <Loader label="Loading attendance..." />
          ) : !summaries || summaries.length === 0 ? (
            <EmptyState message="No students enrolled in this class yet." />
          ) : sessionDates.length === 0 ? (
            <EmptyState message="Attendance records will appear here after you mark your first session." />
          ) : (
            <table className="results-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Total Classes</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr key={s.student._id}>
                    <td>{s.student.fullName}</td>
                    <td>{s.totalClasses}</td>
                    <td>{s.present}</td>
                    <td>{s.absent}</td>
                    <td>
                      <span className={`attendance-pct ${pctClass(s.percentage)}`}>
                        {s.percentage !== null ? `${s.percentage}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {showMarkModal && (
        <MarkAttendanceModal
          classId={selectedClassId}
          onClose={() => setShowMarkModal(false)}
          onMarked={() => {
            setShowMarkModal(false);
            loadAttendance(selectedClassId);
          }}
        />
      )}
    </div>
  );
}
