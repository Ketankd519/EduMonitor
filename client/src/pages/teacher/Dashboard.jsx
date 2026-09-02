import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeacherDashboard } from '../../api/dashboardApi';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTeacherDashboard()
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
      <p className="dashboard-subtitle">Here's an overview of your classes and students</p>

      <div className="stat-grid">
        <StatCard label="My Classes" value={stats.totalClasses} />
        <StatCard label="Total Students" value={stats.totalStudents} />
        <StatCard label="Pending Assignments" value={stats.pendingAssignments} />
        <StatCard label="Today's Live Classes" value={stats.todaysLiveClasses} />
        <StatCard
          label="Avg. Class Attendance"
          value={stats.averageClassAttendance !== null ? `${stats.averageClassAttendance}%` : 'No data yet'}
          muted={stats.averageClassAttendance === null}
        />
      </div>

      <h2 className="section-title">Recent Activity</h2>
      {stats.recentActivity.length === 0 ? (
        <EmptyState message="No recent activity yet." />
      ) : (
        <div>
          {stats.recentActivity.map((a) => (
            <div key={a.id} className="stat-card" style={{ marginBottom: '0.75rem' }}>
              {a.content}
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Your Classes</h2>
      {stats.totalClasses === 0 ? (
        <EmptyState
          message="You haven't created any classes yet."
          actionLabel="+ Create Class"
          onAction={() => navigate('/teacher/classes')}
        />
      ) : null}
    </div>
  );
}
