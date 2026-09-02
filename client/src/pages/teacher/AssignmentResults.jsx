import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAllSubmissions } from '../../api/submissionApi';
import { getAssignmentById } from '../../api/assignmentApi';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import StatCard from '../../components/common/StatCard';

export default function AssignmentResults() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [classAverage, setClassAverage] = useState(null);
  const [totalMarks, setTotalMarks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAssignmentById(assignmentId), getAllSubmissions(assignmentId)])
      .then(([aRes, sRes]) => {
        if (cancelled) return;
        setAssignment(aRes.data.data.assignment);
        setSubmissions(sRes.data.data.submissions);
        setClassAverage(sRes.data.data.classAverage);
        setTotalMarks(sRes.data.data.totalMarks);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load results.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  if (loading) return <Loader label="Loading results..." />;
  if (error) return <EmptyState message={error} />;

  const chartData = submissions.map((s) => ({
    name: s.student.fullName.split(' ')[0],
    percentage: s.percentage,
  }));

  return (
    <div>
      <h1 className="dashboard-welcome">{assignment.title} — Results</h1>
      <p className="dashboard-subtitle">
        {submissions.length} submission{submissions.length === 1 ? '' : 's'} &middot; Total Marks: {totalMarks}
      </p>

      <div className="stat-grid">
        <StatCard label="Submissions" value={submissions.length} />
        <StatCard
          label="Class Average"
          value={classAverage !== null ? `${classAverage}%` : 'No submissions yet'}
          muted={classAverage === null}
        />
      </div>

      {submissions.length === 0 ? (
        <EmptyState message="No students have submitted this assignment yet." />
      ) : (
        <>
          <h2 className="section-title">Class Performance</h2>
          <div style={{ background: '#fff', borderRadius: 14, padding: '1.25rem', border: '1px solid #eef2f7', marginBottom: '1.5rem' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="percentage" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h2 className="section-title">Individual Results</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s._id}>
                  <td>{s.student.fullName}</td>
                  <td>{s.score}/{s.totalMarks}</td>
                  <td>{s.percentage}%</td>
                  <td>{new Date(s.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(-1)}
          style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
