import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useLiveTicker } from '../../context/LiveTickerContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import {
  BookOpen,
  FileText,
  CheckCircle2,
  TrendingUp,
  Plus,
  AlertCircle,
  Bell,
  Radio,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './style.css';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const { liveItems } = useLiveTicker();
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
    <div className="student-dashboard">
      <Navbar />

      <div className="student-dashboard-layout">
        <Sidebar />

        <main className="student-dashboard-main">
          {/* Welcome Banner */}
          <section className="student-welcome-banner">
            <div className="student-welcome-content">
              <h1>Welcome back, {user?.name}!</h1>
              <p>
                Track your active virtual classrooms, upcoming tests, and
                academic metrics in real time.
              </p>
            </div>

            <Link to="/classes" className="student-join-class-btn">
              <Plus size={18} />
              <span>Join Class</span>
            </Link>
          </section>

          {/* Live Activities Banner: Prominently displayed when any class or assignment is live */}
          {/* {liveItems && liveItems.length > 0 && (
            <section className="student-live-alert-section" aria-label="Live activities">
              <div className="student-live-alert-header">
                <span className="live-dot-pulse" aria-hidden="true" />
                <h2>Live Now</h2>
              </div>
              <div className="student-live-alert-grid">
                {liveItems.map((item) => {
                  const isLiveClass = item.type === 'live-class';
                  const targetPath = isLiveClass ? `/classroom/${item.classId}` : '/assignments';
                  const linkState = isLiveClass
                    ? null
                    : { classId: item.classId, assignmentId: item.assignmentId };

                  return (
                    <article
                      key={item.id}
                      className={`student-live-alert-card student-live-alert-card--${item.type}`}
                    >
                      <div className="student-live-alert-icon">
                        {isLiveClass ? <Radio size={20} color="#dc2626" /> : <FileCheck size={20} color="#dc2626" />}
                      </div>
                      <div className="student-live-alert-body">
                        <span className="student-live-alert-tag">
                          {isLiveClass ? 'Live Class Active' : 'MCQ Exam Open'}
                        </span>
                        <h3 className="student-live-alert-title">{item.text}</h3>
                        <p className="student-live-alert-desc">
                          {isLiveClass
                            ? 'A live lecture session is underway. Click below to view classroom details and join.'
                            : 'An examination is active and accepting submissions. Click below to view in assignments.'}
                        </p>
                      </div>
                      <Link
                        to={targetPath}
                        state={linkState}
                        className="student-live-alert-btn"
                      >
                        <span>{isLiveClass ? 'View Class' : 'View Test'}</span>
                        <ArrowRight size={16} />
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          )} */}

          {loading ? (
            <div className="student-loading">Loading statistics...</div>
          ) : (
            <>
              {/* KPI Stat Cards */}
              <section className="student-stats-grid">
                <StatCard
                  title="Joined Classes"
                  value={summary?.totalClasses || 0}
                  icon={<BookOpen color="#1e3a8a" />}
                  color="#dbeafe"
                />

                <StatCard
                  title="Upcoming Assignments"
                  value={summary?.upcomingAssignments || 0}
                  icon={<FileText color="#d97706" />}
                  color="#fef3c7"
                />

                <StatCard
                  title="Attendance Rate"
                  value={`${summary?.attendancePercentage || 100}%`}
                  icon={<CheckCircle2 color="#059669" />}
                  color="#d1fae5"
                />

                <StatCard
                  title="Avg Score"
                  value={`${summary?.avgAssignmentScore || 0}%`}
                  icon={<TrendingUp color="#1e3a8a" />}
                  color="#e0e7ff"
                />
              </section>

              {/* Announcements Section */}
              <section className="student-announcements">
                <div className="student-announcements-header">
                  <Bell size={20} color="var(--primary-blue)" />
                  <h2>Recent Announcements</h2>
                </div>

                {recentPosts.length === 0 ? (
                  <div className="student-empty-announcements">
                    <AlertCircle size={32} />
                    <p>
                      No announcements posted yet in your joined classes.
                    </p>
                  </div>
                ) : (
                  <div className="student-announcements-list">
                    {recentPosts.map((post) => (
                      <article
                        key={post._id}
                        className="student-announcement-card"
                      >
                        <div className="student-announcement-meta">
                          <span className="student-announcement-subject">
                            {post.class?.subjectTitle} (
                            {post.class?.subjectCode})
                          </span>

                          <span className="student-announcement-date">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="student-announcement-content">
                          {post.content}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <article className="student-stat-card">
    <div
      className="student-stat-icon"
      style={{ backgroundColor: color }}
    >
      {icon}
    </div>

    <div className="student-stat-info">
      <span className="student-stat-title">{title}</span>
      <span className="student-stat-value">{value}</span>
    </div>
  </article>
);

export default StudentDashboard;
