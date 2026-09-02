import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getMyClasses } from '../../api/classApi';
import { getMyAcademicRecord } from '../../api/academicRecordApi';
import ClassPicker from '../../components/common/ClassPicker';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';

export default function StudentAcademicRecords() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyClasses().then((res) => {
      const list = res.data.data.classes;
      setClasses(list);
      if (list.length > 0) setSelectedClassId(list[0]._id);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    setLoading(true);
    getMyAcademicRecord(selectedClassId)
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, [selectedClassId]);

  if (classes.length === 0 && !loading) {
    return (
      <div>
        <h1 className="dashboard-welcome">Academic Records</h1>
        <EmptyState message="No classes joined yet." />
      </div>
    );
  }

  const chartData = data
    ? [
        { name: 'Assignment', value: data.record.assignmentMarks },
        { name: 'Internal', value: data.record.internalMarks },
        { name: 'Exam', value: data.record.examMarks },
        { name: 'Incentive', value: data.record.incentiveMarks },
        { name: 'MCQ', value: data.record.mcqMarks },
        { name: 'Other', value: data.record.otherMarks },
      ]
    : [];

  return (
    <div>
      <h1 className="dashboard-welcome">Academic Records</h1>
      <p className="dashboard-subtitle">Your marks and performance summary</p>

      <ClassPicker classes={classes} selectedId={selectedClassId} onSelect={setSelectedClassId} />

      {loading ? (
        <Loader label="Loading record..." />
      ) : !data ? (
        <EmptyState message="No academic record available yet." />
      ) : (
        <>
          <div className="stat-grid" style={{ marginTop: '1.25rem' }}>
            <StatCard label="Overall Marks" value={data.record.overallMarks} />
            <StatCard
              label="Attendance"
              value={data.attendance.percentage !== null ? `${data.attendance.percentage}%` : 'No data yet'}
              muted={data.attendance.percentage === null}
            />
            <StatCard
              label="Avg. Assignment Score"
              value={data.averageAssignmentScore !== null ? `${data.averageAssignmentScore}%` : 'No data yet'}
              muted={data.averageAssignmentScore === null}
            />
            <StatCard label="Roll Number" value={data.record.rollNumber || '—'} muted={!data.record.rollNumber} />
          </div>

          <h2 className="section-title">Marks Breakdown</h2>
          <div style={{ background: '#fff', borderRadius: 14, padding: '1.25rem', border: '1px solid #eef2f7' }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
