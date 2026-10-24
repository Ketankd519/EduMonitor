import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import {
  BookOpen,
  Users,
  Clock,
  Video,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './style.css';

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
    <div className="teacher-dashboard">
      <Navbar />

      <div className="teacher-dashboard-layout">
        <Sidebar />

        <main className="teacher-dashboard-main">
          {/* Welcome Banner */}
          <section className="teacher-welcome-banner">
            <div className="teacher-welcome-content">
              <h1>Welcome, Prof. {user?.name}!</h1>
              <p>
                Manage course sections, assignments, attendance logs, and
                real-time live video sessions.
              </p>
            </div>

            <Link to="/classes" className="teacher-create-class-btn">
              <Plus size={18} />
              <span>Create Class</span>
            </Link>
          </section>

          {loading ? (
            <div className="teacher-loading">
              Loading statistics...
            </div>
          ) : (
            <section className="teacher-stats-grid">
              <StatCard
                title="Active Classes"
                value={summary?.totalClasses || 0}
                icon={<BookOpen color="#059669" />}
                color="#d1fae5"
              />

              <StatCard
                title="Enrolled Students"
                value={summary?.totalStudents || 0}
                icon={<Users color="#1e3a8a" />}
                color="#dbeafe"
              />

              <StatCard
                title="Pending Tests"
                value={summary?.pendingAssignments || 0}
                icon={<Clock color="#d97706" />}
                color="#fef3c7"
              />

              <StatCard
                title="Today's Live Classes"
                value={summary?.todayLiveClasses || 0}
                icon={<Video color="#dc2626" />}
                color="#fee2e2"
              />

              <StatCard
                title="Avg Attendance"
                value={`${summary?.avgAttendance ?? 100}%`}
                icon={<CheckCircle2 color="#059669" />}
                color="#d1fae5"
              />
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <article className="teacher-stat-card">
    <div
      className="teacher-stat-icon"
      style={{ backgroundColor: color }}
    >
      {icon}
    </div>

    <div className="teacher-stat-info">
      <span className="teacher-stat-title">{title}</span>
      <span className="teacher-stat-value">{value}</span>
    </div>
  </article>
);

export default TeacherDashboard;