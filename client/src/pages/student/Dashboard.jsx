import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentDashboard } from '../../api/dashboardApi';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStudentDashboard()
      .then((res) => {
        if (!cancelled) setStats(res.data.data.stats);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load dashboard data. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loader label="Loading dashboard..." />;
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>;

  return (
    <div>
      <h1 className="dashboard-welcome">Welcome, {user?.fullName}</h1>
      <p className="dashboard-subtitle">Here's an overview of your academic activity</p>

      <div className="stat-grid">
        <StatCard label="Enrolled Classes" value={stats.enrolledClasses} />
        <StatCard label="Upcoming Assignments" value={stats.upcomingAssignments} />
        <StatCard
          label="Attendance"
          value={stats.attendancePercentage !== null ? `${stats.attendancePercentage}%` : 'No data yet'}
          muted={stats.attendancePercentage === null}
        />
        <StatCard
          label="Avg. Assignment Score"
          value={stats.averageAssignmentScore !== null ? `${stats.averageAssignmentScore}%` : 'No data yet'}
          muted={stats.averageAssignmentScore === null}
        />
      </div>

      <h2 className="section-title">Recent Announcements</h2>
      {stats.recentAnnouncements.length === 0 ? (
        <EmptyState message="No announcements yet." />
      ) : (
        <div>
          {stats.recentAnnouncements.map((a) => (
            <div key={a.id} className="stat-card" style={{ marginBottom: '0.75rem' }}>
              {a.content}
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Your Classes</h2>
      {stats.enrolledClasses === 0 ? (
        <EmptyState
          message="No classes joined yet."
          actionLabel="+ Join Class"
          onAction={() => navigate('/student/classes')}
        />
      ) : null}
    </div>
  );
}
