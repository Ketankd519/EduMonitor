import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getMyClasses } from '../../api/classApi';
import { getMyAttendance } from '../../api/attendanceApi';
import ClassPicker from '../../components/common/ClassPicker';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';

const COLORS = ['#16a34a', '#dc2626'];

export default function StudentAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
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
    getMyAttendance(selectedClassId)
      .then((res) => {
        setSummary(res.data.data.summary);
        setRecords(res.data.data.records);
      })
      .finally(() => setLoading(false));
  }, [selectedClassId]);

  if (classes.length === 0 && !loading) {
    return (
      <div>
        <h1 className="dashboard-welcome">Attendance</h1>
        <EmptyState message="No classes joined yet." />
      </div>
    );
  }

  const chartData = summary
    ? [
        { name: 'Present', value: summary.present },
        { name: 'Absent', value: summary.absent },
      ]
    : [];

  return (
    <div>
      <h1 className="dashboard-welcome">Attendance</h1>
      <p className="dashboard-subtitle">
        This tracks whether you were present — a separate measure from AI-based attention,
        which is tracked during live classes (Phase 9+).
      </p>

      <ClassPicker classes={classes} selectedId={selectedClassId} onSelect={setSelectedClassId} />

      {loading ? (
        <Loader label="Loading attendance..." />
      ) : !summary || summary.totalClasses === 0 ? (
        <EmptyState message="Attendance records will appear here after your classes." />
      ) : (
        <>
          <div className="stat-grid" style={{ marginTop: '1.25rem' }}>
            <StatCard label="Total Classes" value={summary.totalClasses} />
            <StatCard label="Present" value={summary.present} />
            <StatCard label="Absent" value={summary.absent} />
            <StatCard label="Attendance %" value={`${summary.percentage}%`} />
          </div>

          <h2 className="section-title">Breakdown</h2>
          <div style={{ background: '#fff', borderRadius: 14, padding: '1.25rem', border: '1px solid #eef2f7', marginBottom: '1.5rem' }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <h2 className="section-title">Session History</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td style={{ textTransform: 'capitalize', color: r.status === 'present' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {r.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
