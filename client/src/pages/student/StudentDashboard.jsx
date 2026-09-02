import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { BookOpen, FileText, CheckCircle2, TrendingUp, Plus, AlertCircle, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await API.get('/users/dashboard');
      setSummary(res.data.summary);
      setRecentPosts(res.data.recentPosts || []);
    } catch (err) {
      console.error('Failed to load student metrics', err);
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
            background: 'linear-gradient(135deg, var(--primary-blue) 0%, #1e40af 100%)',
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
              <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Welcome back, {user?.name}!</h1>
              <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                Track your active virtual classrooms, upcoming tests, and academic metrics in real time.
              </p>
            </div>
            <Link to="/classes" style={{
              background: '#ffffff',
              color: 'var(--primary-blue)',
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
              <span>Join Class</span>
            </Link>
          </div>

          {loading ? (
            <div>Loading statistics...</div>
          ) : (
            <>
              {/* KPI Stat Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2.5rem'
              }}>
                <StatCard title="Joined Classes" value={summary?.totalClasses || 0} icon={<BookOpen color="#1e3a8a" />} color="#dbeafe" />
                <StatCard title="Upcoming Assignments" value={summary?.upcomingAssignments || 0} icon={<FileText color="#d97706" />} color="#fef3c7" />
                <StatCard title="Attendance Rate" value={`${summary?.attendancePercentage || 100}%`} icon={<CheckCircle2 color="#059669" />} color="#d1fae5" />
                <StatCard title="Avg Score" value={`${summary?.avgAssignmentScore || 0}%`} icon={<TrendingUp color="#1e3a8a" />} color="#e0e7ff" />
              </div>

              {/* Announcements Section */}
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <Bell size={20} color="var(--primary-blue)" />
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-dark)' }}>Recent Announcements</h2>
                </div>

                {recentPosts.length === 0 ? (
                  <div style={{
                    padding: '2.5rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-light)',
                    borderRadius: '8px'
                  }}>
                    <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0 }}>No announcements posted yet in your joined classes.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {recentPosts.map((post) => (
                      <div key={post._id} style={{
                        padding: '1rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        background: '#fafafa'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary-blue)' }}>
                            {post.class?.subjectTitle} ({post.class?.subjectCode})
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-dark)', fontSize: '0.95rem' }}>{post.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
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

export default StudentDashboard;