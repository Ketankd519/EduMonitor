import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { Award, Save, CheckCircle2 } from 'lucide-react';

const AcademicRecordsPage = () => {
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [records, setRecords] = useState([]);
  const [studentRecord, setStudentRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchRecords();
    }
  }, [selectedClassId]);

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

  const fetchRecords = async () => {
    try {
      const res = await API.get(`/academic-records/class/${selectedClassId}`);
      if (isTeacher) {
        setRecords(res.data.records || []);
      } else {
        setStudentRecord(res.data.record);
      }
    } catch (err) {
      console.error('Error fetching academic records', err);
    }
  };

  const handleFieldChange = (recordId, field, value) => {
    setRecords(
      records.map((r) => (r._id === recordId ? { ...r, [field]: value } : r))
    );
  };

  const handleSaveRecord = async (rec) => {
    try {
      await API.put(`/academic-records/${rec._id}`, rec);
      alert(`Updated grades for ${rec.student.name}`);
      fetchRecords();
    } catch (err) {
      alert('Failed to save academic record.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem', maxWidth: '1100px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.75rem' }}>Academic Performance Ledger</h1>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>Internal marks, assignment evaluations, and examination score tracking</p>
            </div>
          </div>

          {/* Class Dropdown Selector */}
          <div style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontWeight: 'bold' }}>Classroom:</label>
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.subjectTitle} ({c.classCode})</option>
              ))}
            </select>
          </div>

          {isTeacher ? (
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>Student</th>
                    <th style={{ padding: '0.75rem' }}>Attendance Marks</th>
                    <th style={{ padding: '0.75rem' }}>Assignment Marks</th>
                    <th style={{ padding: '0.75rem' }}>Internal Marks</th>
                    <th style={{ padding: '0.75rem' }}>Exam Marks</th>
                    <th style={{ padding: '0.75rem' }}>Incentive Marks</th>
                    <th style={{ padding: '0.75rem' }}>Overall Marks</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{rec.student?.name}</td>
                      <td style={{ padding: '0.5rem' }}><input type="number" value={rec.attendanceMarks} onChange={(e) => handleFieldChange(rec._id, 'attendanceMarks', e.target.value)} style={{ width: '60px', padding: '0.3rem' }} /></td>
                      <td style={{ padding: '0.5rem' }}><input type="number" value={rec.assignmentMarks} onChange={(e) => handleFieldChange(rec._id, 'assignmentMarks', e.target.value)} style={{ width: '60px', padding: '0.3rem' }} /></td>
                      <td style={{ padding: '0.5rem' }}><input type="number" value={rec.internalMarks} onChange={(e) => handleFieldChange(rec._id, 'internalMarks', e.target.value)} style={{ width: '60px', padding: '0.3rem' }} /></td>
                      <td style={{ padding: '0.5rem' }}><input type="number" value={rec.examMarks} onChange={(e) => handleFieldChange(rec._id, 'examMarks', e.target.value)} style={{ width: '60px', padding: '0.3rem' }} /></td>
                      <td style={{ padding: '0.5rem' }}><input type="number" value={rec.incentiveMarks} onChange={(e) => handleFieldChange(rec._id, 'incentiveMarks', e.target.value)} style={{ width: '60px', padding: '0.3rem' }} /></td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>{rec.overallMarks}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button onClick={() => handleSaveRecord(rec)} style={{ background: 'var(--primary-blue)', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Student View Ledger Card */
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
              <h2 style={{ margin: '0 0 1.5rem', color: 'var(--primary-blue)' }}>Your Course Marks Breakdown</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <MarkBox label="Attendance Marks" value={studentRecord?.attendanceMarks || 0} />
                <MarkBox label="Assignment Marks" value={studentRecord?.assignmentMarks || 0} />
                <MarkBox label="Internal Test" value={studentRecord?.internalMarks || 0} />
                <MarkBox label="Final Exam" value={studentRecord?.examMarks || 0} />
                <MarkBox label="Incentive Points" value={studentRecord?.incentiveMarks || 0} />
              </div>
              <div style={{ marginTop: '2rem', padding: '1rem', background: '#f1f5f9', borderRadius: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-blue)' }}>
                Total Score: {studentRecord?.overallMarks || 0} Marks
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const MarkBox = ({ label, value }) => (
  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{label}</span>
    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{value}</span>
  </div>
);

export default AcademicRecordsPage;