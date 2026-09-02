import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { BookOpen, Users, Clock, Video, CheckCircle2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await API.get('/users/dashboard');
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Failed to load teacher metrics', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px' }}>
          {/* Welcome Banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--academic-green) 0%, #047857 100%)',
            color: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Welcome, Prof. {user?.name}!</h1>
              <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                Manage course sections, assignments, attendance logs, and real-time live video sessions.
              </p>
            </div>
            <Link to="/classes" style={{
              background: '#ffffff',
              color: 'var(--academic-green)',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Plus size={18} />
              <span>Create Class</span>
            </Link>
          </div>

          {loading ? (
            <div>Loading statistics...</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2.5rem'
            }}>
              <StatCard title="Active Classes" value={summary?.totalClasses || 0} icon={<BookOpen color="#059669" />} color="#d1fae5" />
              <StatCard title="Enrolled Students" value={summary?.totalStudents || 0} icon={<Users color="#1e3a8a" />} color="#dbeafe" />
              <StatCard title="Pending Tests" value={summary?.pendingAssignments || 0} icon={<Clock color="#d97706" />} color="#fef3c7" />
              <StatCard title="Today's Live Classes" value={summary?.todayLiveClasses || 0} icon={<Video color="#dc2626" />} color="#fee2e2" />
              <StatCard title="Avg Attendance" value={`${summary?.avgAttendance || 100}%`} icon={<CheckCircle2 color="#059669" />} color="#d1fae5" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div style={{
    background: '#ffffff',
    padding: '1.25rem',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  }}>
    <div style={{ background: color, padding: '0.85rem', borderRadius: '10px', display: 'flex' }}>
      {icon}
    </div>
    <div>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>{title}</span>
      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{value}</span>
    </div>
  </div>
);

export default TeacherDashboard;