import { useEffect, useState } from 'react';
import { getMyClasses } from '../../api/classApi';
import { getClassAcademicRecords } from '../../api/academicRecordApi';
import ClassPicker from '../../components/common/ClassPicker';
import EditRecordModal from '../../components/academic/EditRecordModal';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

export default function TeacherAcademicRecords() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    getMyClasses().then((res) => {
      const list = res.data.data.classes;
      setClasses(list);
      if (list.length > 0) setSelectedClassId(list[0]._id);
      else setLoading(false);
    });
  }, []);

  const loadRecords = (classId) => {
    if (!classId) return;
    setLoading(true);
    getClassAcademicRecords(classId)
      .then((res) => setRecords(res.data.data.records))
      .catch(() => setError('Could not load academic records.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedClassId) loadRecords(selectedClassId);
  }, [selectedClassId]);

  const handleSaved = (updated) => {
    setRecords((prev) => prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)));
    setEditingRecord(null);
  };

  return (
    <div>
      <h1 className="dashboard-welcome">Academic Records</h1>
      <p className="dashboard-subtitle">Maintain marks and academic performance by class</p>

      {classes.length === 0 && !loading ? (
        <EmptyState message="You haven't created any classes yet." />
      ) : (
        <>
          <ClassPicker classes={classes} selectedId={selectedClassId} onSelect={setSelectedClassId} />

          {error && <p style={{ color: '#dc2626', margin: '1rem 0' }}>{error}</p>}

          {loading ? (
            <Loader label="Loading records..." />
          ) : !records || records.length === 0 ? (
            <EmptyState message="No students enrolled in this class yet." />
          ) : (
            <table className="results-table" style={{ marginTop: '1.25rem' }}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Attendance</th>
                  <th>Assignment</th>
                  <th>Internal</th>
                  <th>Exam</th>
                  <th>Incentive</th>
                  <th>MCQ</th>
                  <th>Other</th>
                  <th>Overall</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    <td>{r.student.fullName}</td>
                    <td>{r.rollNumber || '—'}</td>
                    <td>{r.attendance.percentage !== null ? `${r.attendance.percentage}%` : '—'}</td>
                    <td>{r.assignmentMarks}</td>
                    <td>{r.internalMarks}</td>
                    <td>{r.examMarks}</td>
                    <td>{r.incentiveMarks}</td>
                    <td>{r.mcqMarks}</td>
                    <td>{r.otherMarks}</td>
                    <td style={{ fontWeight: 700 }}>{r.overallMarks}</td>
                    <td>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditingRecord(r)}
                        style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
