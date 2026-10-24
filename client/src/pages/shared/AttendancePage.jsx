
import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { Save, CheckCircle2 } from 'lucide-react';
import './style2.css';

const AttendancePage = () => {
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Teacher attendance entry
  const [studentsAttendance, setStudentsAttendance] = useState([]);

  // Student attendance summary
  const [studentSummary, setStudentSummary] = useState(null);
  const [totalSessions, setTotalSessions] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const markAllCheckboxRef = useRef(null);

  const isAllPresent =
    studentsAttendance.length > 0 &&
    studentsAttendance.every((sa) => sa.status === 'PRESENT');
  const isSomePresent =
    studentsAttendance.some((sa) => sa.status === 'PRESENT') && !isAllPresent;

  useEffect(() => {
    if (markAllCheckboxRef.current) {
      markAllCheckboxRef.current.indeterminate = isSomePresent;
    }
  }, [isSomePresent]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchAttendanceData();
    }
  }, [selectedClassId, selectedDate]);

  const fetchClasses = async () => {
    try {
      const res = await API.get('/classes');
      const fetchedClasses = res.data.classes || [];

      setClasses(fetchedClasses);

      if (fetchedClasses.length > 0) {
        setSelectedClassId(fetchedClasses[0]._id);
      }
    } catch (err) {
      console.error('Error fetching classes', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      if (isTeacher) {
        const res = await API.get(
          `/attendance/class/${selectedClassId}?date=${selectedDate}`
        );

        setStudentsAttendance(res.data.attendance || []);
        setTotalSessions(res.data.totalSessions ?? 0);
      } else {
        const res = await API.get(
          `/attendance/class/${selectedClassId}`
        );

        setStudentSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Error fetching attendance data', err);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setStudentsAttendance((previousAttendance) =>
      previousAttendance.map((sa) =>
        sa.student._id === studentId ? { ...sa, status } : sa
      )
    );
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setMsg('');

    try {
      const payload = studentsAttendance.map((sa) => ({
        studentId: sa.student._id,
        status: sa.status,
      }));

      await API.post('/attendance', {
        classId: selectedClassId,
        date: selectedDate,
        records: payload,
      });

      setMsg('Attendance records saved successfully.');
      await fetchAttendanceData();
    } catch (err) {
      alert('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMarkAllPresent = () => {
    if (studentsAttendance.length === 0) return;

    if (isAllPresent) {
      setStudentsAttendance((prev) =>
        prev.map((sa) => ({ ...sa, status: 'ABSENT' }))
      );
    } else {
      setStudentsAttendance((prev) =>
        prev.map((sa) => ({ ...sa, status: 'PRESENT' }))
      );
    }
  };

  return (
    <div className="attendance-page">
      <Navbar />

      <div className="attendance-layout">
        <Sidebar />

        <main className="attendance-main">
          <div className="attendance-page-header">
            <div>
              <h1 className="attendance-page-title">
                Attendance Management
              </h1>

              <p className="attendance-page-subtitle">
                Track classroom presence and compliance rates
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="attendance-controls">
            <div className="attendance-control-group">
              <label
                className="attendance-label"
                htmlFor="attendance-class"
              >
                Classroom:
              </label>

              <select
                id="attendance-class"
                className="attendance-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.subjectTitle} ({c.classCode})
                  </option>
                ))}
              </select>
            </div>

            {isTeacher && (
              <div className="attendance-control-group">
                <label
                  className="attendance-label"
                  htmlFor="attendance-date"
                >
                  Session Date:
                </label>

                <input
                  id="attendance-date"
                  className="attendance-date-input"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {msg && (
            <div className="attendance-success-message">
              <CheckCircle2 size={18} />
              <span>{msg}</span>
            </div>
          )}

          {/* Teacher View */}
          {isTeacher ? (
            <div className="attendance-card attendance-teacher-card">
              <div className="attendance-card-header">
                <div className="attendance-card-header-left">
                  <h3 className="attendance-card-title">
                    Enrolled Student List
                  </h3>

                  <span className="attendance-total-sessions-badge">
                    Total Sessions: <strong>{totalSessions}</strong>
                  </span>

                  {studentsAttendance.length > 0 && (
                    <label className="attendance-mark-all-label" title="Mark all enrolled students Present">
                      <input
                        type="checkbox"
                        ref={markAllCheckboxRef}
                        checked={isAllPresent}
                        onChange={handleToggleMarkAllPresent}
                        disabled={saving}
                      />
                      <span>Mark all enrolled students Present</span>
                    </label>
                  )}
                </div>

                <button
                  className="attendance-save-btn"
                  onClick={handleSaveAttendance}
                  disabled={saving}
                >
                  <Save size={16} />
                  <span>
                    {saving ? 'Saving...' : 'Save Attendance'}
                  </span>
                </button>
              </div>

              {studentsAttendance.length === 0 ? (
                <div className="attendance-empty-state">
                  No enrolled students in this classroom yet.
                </div>
              ) : (
                <div className="attendance-table-wrapper">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Roll Number</th>
                        <th className="attendance-percentage-header">
                          Attendance %
                        </th>
                        <th className="attendance-status-cell">
                          Presence Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {studentsAttendance.map((sa) => (
                        <tr key={sa.student._id}>
                          <td className="attendance-student-name">
                            {sa.student.name}
                          </td>

                          <td className="attendance-student-roll">
                            {sa.student.rollNumber || '—'}
                          </td>

                          <td className="attendance-percentage-cell">
                            <strong>
                              {typeof sa.attendancePercentage === 'number'
                                ? `${sa.attendancePercentage.toFixed(1)}%`
                                : '0%'}
                            </strong>
                          </td>

                          <td className="attendance-status-cell">
                            <div className="attendance-status-actions">
                              <button
                                className={`attendance-status-btn ${
                                  sa.status === 'PRESENT'
                                    ? 'attendance-status-btn--present-active'
                                    : 'attendance-status-btn--inactive'
                                }`}
                                onClick={() =>
                                  handleStatusChange(
                                    sa.student._id,
                                    'PRESENT'
                                  )
                                }
                              >
                                Present
                              </button>

                              <button
                                className={`attendance-status-btn ${
                                  sa.status === 'ABSENT'
                                    ? 'attendance-status-btn--absent-active'
                                    : 'attendance-status-btn--inactive'
                                }`}
                                onClick={() =>
                                  handleStatusChange(
                                    sa.student._id,
                                    'ABSENT'
                                  )
                                }
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Student View */
            <div className="attendance-card attendance-student-card">
              <h2 className="attendance-summary-title">
                Your Attendance Summary
              </h2>

              <div className="attendance-summary-grid">
                <div className="attendance-stat-card attendance-stat-card--total">
                  <span className="attendance-stat-label">
                    Total Sessions
                  </span>

                  <span className="attendance-stat-value">
                    {studentSummary?.totalSessions || 0}
                  </span>
                </div>

                <div className="attendance-stat-card attendance-stat-card--present">
                  <span className="attendance-stat-label">
                    Sessions Attended
                  </span>

                  <span className="attendance-stat-value">
                    {studentSummary?.presentCount || 0}
                  </span>
                </div>

                <div className="attendance-stat-card attendance-stat-card--percentage">
                  <span className="attendance-stat-label">
                    Attendance Percentage
                  </span>

                  <span className="attendance-stat-value">
                    {studentSummary?.percentage ?? 100}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AttendancePage;
