import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { BarChart3, Clock, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import './style.css';

const MonitoringReportsPage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sessionsList, setSessionsList] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassSessions(selectedClassId);
    } else {
      setSessionsList([]);
      setSelectedSessionId('');
      setReport(null);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionReport(selectedSessionId);
    } else {
      setReport(null);
    }
  }, [selectedSessionId]);

  const fetchTeacherClasses = async () => {
    try {
      const res = await API.get('/classes');
      const teacherClasses = res.data.classes || [];

      setClasses(teacherClasses);

      if (teacherClasses.length > 0) {
        setSelectedClassId(teacherClasses[0]._id);
      }
    } catch (err) {
      console.error('Error fetching teacher classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSessions = async (classId) => {
    setSessionsLoading(true);
    try {
      const res = await API.get(`/live-classes/class/${classId}`);
      const sessions = res.data.sessions || [];
      setSessionsList(sessions);

      if (sessions.length > 0) {
        setSelectedSessionId(sessions[0]._id);
      } else {
        setSelectedSessionId('');
        setReport(null);
      }
    } catch (err) {
      console.error('Error fetching live class sessions:', err);
      // Fallback: check if active live session exists
      try {
        const liveRes = await API.get(`/live-classes/active/${classId}`);
        if (liveRes.data?.liveSession) {
          setSessionsList([liveRes.data.liveSession]);
          setSelectedSessionId(liveRes.data.liveSession._id);
          return;
        }
      } catch (fallbackErr) {
        console.error('Fallback active session error:', fallbackErr);
      }
      setSessionsList([]);
      setSelectedSessionId('');
      setReport(null);
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchSessionReport = async (sessionId) => {
    setReportLoading(true);
    try {
      const reportRes = await API.get(`/monitoring/report/${sessionId}`);
      setReport(reportRes.data);
    } catch (err) {
      console.error('Error fetching monitoring report for session:', err);
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  const summary = report?.summary;
  const liveClass = report?.liveClass;
  const isClassLive = liveClass?.status === 'LIVE';

  return (
    <div className="monitoring-reports-page">
      <Navbar />

      <div className="monitoring-reports-layout">
        <Sidebar />

        <main className="monitoring-reports-main">
          <header className="monitoring-reports-header">
            <div>
              <h1 className="monitoring-reports-title">
                AI Activity &amp; Attendance Reports
              </h1>

              <p className="monitoring-reports-subtitle">
                Classroom attention metrics, presence durations, and distraction summaries
              </p>
            </div>
          </header>

          {/* Controls Bar */}
          <div className="monitoring-reports-controls">
            <div className="monitoring-reports-control-item">
              <label
                className="monitoring-reports-label"
                htmlFor="monitoring-class-select"
              >
                Classroom:
              </label>

              <select
                id="monitoring-class-select"
                className="monitoring-reports-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={loading || classes.length === 0}
              >
                {classes.length === 0 && (
                  <option value="">No classrooms available</option>
                )}

                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.subjectTitle} ({c.classCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="monitoring-reports-control-item">
              <label
                className="monitoring-reports-label"
                htmlFor="monitoring-session-select"
              >
                Lecture Session:
              </label>

              <select
                id="monitoring-session-select"
                className="monitoring-reports-select"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                disabled={sessionsLoading || sessionsList.length === 0}
              >
                {sessionsList.length === 0 && (
                  <option value="">
                    {sessionsLoading ? 'Loading sessions...' : 'No sessions recorded yet'}
                  </option>
                )}

                {sessionsList.map((s) => {
                  const dateStr = s.startTime || s.createdAt
                    ? new Date(s.startTime || s.createdAt).toLocaleDateString()
                    : '';
                  const timeStr = s.startTime || s.createdAt
                    ? new Date(s.startTime || s.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '';
                  return (
                    <option key={s._id} value={s._id}>
                      {s.title || 'Live Session'} — {dateStr} {timeStr} ({s.status})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {loading || sessionsLoading ? (
            <div className="monitoring-reports-state">
              <div className="monitoring-reports-spinner" />
              <p>Loading sessions...</p>
            </div>
          ) : reportLoading ? (
            <div className="monitoring-reports-state">
              <div className="monitoring-reports-spinner" />
              <p>Loading monitoring report...</p>
            </div>
          ) : sessionsList.length === 0 ? (
            <div className="monitoring-reports-empty">
              <div className="monitoring-reports-empty-icon">
                <BarChart3 size={42} />
              </div>

              <h3>No Live Sessions Recorded</h3>

              <p>
                No live class sessions have been held for this classroom yet.
                Reports appear after a teacher conducts a live lecture with AI student activity monitoring.
              </p>
            </div>
          ) : !report ? (
            <div className="monitoring-reports-empty">
              <div className="monitoring-reports-empty-icon">
                <BarChart3 size={42} />
              </div>

              <h3>No Monitoring Report Available</h3>

              <p>
                Monitoring data is currently unavailable for the selected session.
              </p>
            </div>
          ) : (
            <>
              {/* Session Meta Header */}
              <div className="monitoring-reports-session-meta">
                <div className="monitoring-reports-session-status">
                  <span
                    className={`monitoring-session-badge ${
                      isClassLive
                        ? 'monitoring-session-badge--live'
                        : 'monitoring-session-badge--ended'
                    }`}
                  >
                    {isClassLive ? 'LIVE NOW' : 'COMPLETED'}
                  </span>
                  <span className="monitoring-session-title">
                    {liveClass?.title || 'Live Lecture'}
                  </span>
                </div>

                <div className="monitoring-reports-duration-badge">
                  <Clock size={16} />
                  <span>
                    Total Class Duration:{' '}
                    <strong>
                      {summary?.totalDurationSeconds !== undefined &&
                      summary?.totalDurationSeconds !== null
                        ? `${summary.totalDurationSeconds} seconds`
                        : '0 seconds'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="monitoring-reports-summary">
                <SummaryCard
                  title="Total Class Duration"
                  value={
                    summary?.totalDurationSeconds !== undefined &&
                    summary?.totalDurationSeconds !== null
                      ? `${summary.totalDurationSeconds} seconds`
                      : '0 seconds'
                  }
                  color="blue"
                />

                <SummaryCard
                  title="Total Students Logged"
                  value={summary?.totalStudents ?? 0}
                  color="blue"
                />

                <SummaryCard
                  title="Average Attendance"
                  value={`${summary?.avgAttendance ?? 100}%`}
                  color="green"
                />

                <SummaryCard
                  title="Average Attention Score"
                  value={`${summary?.avgAttention ?? 100}%`}
                  color={
                    (summary?.avgAttention ?? 100) >= 70
                      ? 'green'
                      : 'red'
                  }
                />

                <SummaryCard
                  title="Mobile Phone Incidents"
                  value={summary?.totalPhoneAlerts ?? 0}
                  color="red"
                />
              </div>

              {/* Student Participation Table */}
              <section className="monitoring-reports-table-card">
                <div className="monitoring-reports-table-header">
                  <h3>Student Participation Ledger</h3>
                  <span>
                    {report.sessions?.length ?? 0} student records
                  </span>
                </div>

                {!report.sessions?.length ? (
                  <div className="monitoring-reports-table-empty">
                    No student participation records were recorded during this session.
                  </div>
                ) : (
                  <div className="monitoring-reports-table-wrapper">
                    <table className="monitoring-reports-table">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Attendance Rate</th>
                          <th>Attention Score</th>
                          <th>Attentive Time</th>
                          <th>Inattentive Time</th>
                          <th className="monitoring-reports-centered">
                            Phone Alerts
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {report.sessions.map((s) => (
                          <tr key={s._id}>
                            <td className="monitoring-reports-student-name">
                              {s.student?.name || 'Unknown Student'}
                            </td>

                            <td>
                              <span className="monitoring-reports-attendance">
                                {s.attendancePercentage ?? 0}%
                              </span>
                            </td>

                            <td>
                              <span
                                className={`monitoring-reports-attention ${
                                  (s.attentionPercentage ?? 0) >= 70
                                    ? 'monitoring-reports-attention--good'
                                    : 'monitoring-reports-attention--low'
                                }`}
                              >
                                {s.attentionPercentage ?? 0}%
                              </span>
                            </td>

                            <td>
                              {Math.round(
                                s.attentiveDurationSeconds ?? 0
                              )}s
                            </td>

                            <td>
                              {Math.round(
                                s.inattentiveDurationSeconds ?? 0
                              )}s
                            </td>

                            <td className="monitoring-reports-centered">
                              <span
                                className={`monitoring-reports-phone-badge ${
                                  (s.phoneDetectedCount ?? 0) > 0
                                    ? 'monitoring-reports-phone-badge--alert'
                                    : 'monitoring-reports-phone-badge--none'
                                }`}
                              >
                                {s.phoneDetectedCount ?? 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

const SummaryCard = ({ title, value, color }) => (
  <div className="monitoring-summary-card">
    <span className="monitoring-summary-title">{title}</span>
    <h2 className={`monitoring-summary-value monitoring-summary-value--${color}`}>
      {value}
    </h2>
  </div>
);

export default MonitoringReportsPage;
