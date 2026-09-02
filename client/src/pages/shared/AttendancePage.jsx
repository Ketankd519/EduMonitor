import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { CalendarCheck, Save, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const AttendancePage = () => {
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Attendance state for teacher batch entry
  const [studentsAttendance, setStudentsAttendance] = useState([]);
  // Student summary
  const [studentSummary, setStudentSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

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
        const res = await API.get(`/attendance/class/${selectedClassId}?date=${selectedDate}`);
        setStudentsAttendance(res.data.attendance || []);
      } else {
        const res = await API.get(`/attendance/class/${selectedClassId}`);
        setStudentSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Error fetching attendance data', err);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setStudentsAttendance(
      studentsAttendance.map((sa) => (sa.student._id === studentId ? { ...sa, status } : sa))
    );
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setMsg('');
    try {
      const payload = studentsAttendance.map((sa) => ({
        studentId: sa.student._id,
        status: sa.status
      }));

      await API.post('/attendance', {
        classId: selectedClassId,
        date: selectedDate,
        records: payload
      });
      setMsg('Attendance records saved successfully.');
    } catch (err) {
      alert('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1000px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.75rem' }}>Attendance Management</h1>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Track classroom presence and compliance rates</p>
            </div>
          </div>

          {/* Controls Bar */}
          <div style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <label style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>Classroom:</label>
              <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.subjectTitle} ({c.classCode})</option>
                ))}
              </select>
            </div>

            {isTeacher && (
              <div>
                <label style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>Session Date:</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
              </div>
            )}
          </div>

          {msg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '0.75rem', borderRadius: '6px', color: 'var(--academic-green)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} />
              <span>{msg}</span>
            </div>
          )}

          {/* Teacher Attendance Entry List */}
          {isTeacher ? (
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0 }}>Enrolled Student List</h3>
                <button onClick={handleSaveAttendance} disabled={saving} style={{ background: 'var(--academic-green)', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
                </button>
              </div>

              {studentsAttendance.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No enrolled students in this classroom yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '0.75rem' }}>Student Name</th>
                      <th style={{ padding: '0.75rem' }}>Email</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Presence Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsAttendance.map((sa) => (
                      <tr key={sa.student._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{sa.student.name}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{sa.student.email}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button onClick={() => handleStatusChange(sa.student._id, 'PRESENT')} style={{ background: sa.status === 'PRESENT' ? 'var(--academic-green)' : '#e2e8f0', color: sa.status === 'PRESENT' ? '#fff' : 'var(--text-dark)', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Present</button>
                            <button onClick={() => handleStatusChange(sa.student._id, 'ABSENT')} style={{ background: sa.status === 'ABSENT' ? 'var(--danger-red)' : '#e2e8f0', color: sa.status === 'ABSENT' ? '#fff' : 'var(--text-dark)', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Absent</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* Student View */
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ margin: '0 0 1.5rem' }}>Your Attendance Summary</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#dbeafe', padding: '1.25rem', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary-blue)', display: 'block' }}>Total Sessions</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>{studentSummary?.totalSessions || 0}</span>
                </div>
                <div style={{ background: '#d1fae5', padding: '1.25rem', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--academic-green)', display: 'block' }}>Sessions Attended</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--academic-green)' }}>{studentSummary?.presentCount || 0}</span>
                </div>
                <div style={{ background: '#fee2e2', padding: '1.25rem', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--danger-red)', display: 'block' }}>Attendance Percentage</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--danger-red)' }}>{studentSummary?.percentage || 100}%</span>
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