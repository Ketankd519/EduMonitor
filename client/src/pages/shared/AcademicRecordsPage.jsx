import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import './style2.css';

const MARK_LIMITS = {
  attendanceMarks: { min: 0, max: 10, label: 'Attendance' },
  assignmentMarks: { min: 0, max: 10, label: 'Assignment' },
  internalMarks: { min: 0, max: 20, label: 'Internal' },
  examMarks: { min: 0, max: 60, label: 'Final Exam' },
  mscMarks: { min: 0, max: 20, label: 'MSC' },
  incentiveMarks: { min: 0, max: 10, label: 'Incentive' }
};

const MARK_FIELDS = Object.keys(MARK_LIMITS);

const AcademicRecordsPage = () => {
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'TEACHER';

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [records, setRecords] = useState([]);
  const [studentRecord, setStudentRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dirty tracking, validation, and saving state
  const [dirtyRecordIds, setDirtyRecordIds] = useState(new Set());
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchRecords();
    }
  }, [selectedClassId]);

  // Alert user before closing tab if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (dirtyRecordIds.size > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirtyRecordIds.size]);

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
      setLoading(true);
      const res = await API.get(
        `/academic-records/class/${selectedClassId}`
      );

      if (isTeacher) {
        setRecords(res.data.records || []);
      } else {
        setStudentRecord(res.data.record);
      }
      setDirtyRecordIds(new Set());
      setFieldErrors({});
    } catch (err) {
      console.error('Error fetching academic records', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (newClassId) => {
    if (newClassId === selectedClassId) return;
    if (dirtyRecordIds.size > 0) {
      const confirmed = window.confirm(
        'You have unsaved changes in this academic ledger. Are you sure you want to discard them and switch classroom?'
      );
      if (!confirmed) return;
    }
    setDirtyRecordIds(new Set());
    setFieldErrors({});
    setBanner(null);
    setSelectedClassId(newClassId);
  };

  const validateField = (field, value) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const num = Number(value);
    const rule = MARK_LIMITS[field];
    if (isNaN(num)) {
      return 'Must be a number';
    }
    if (num < rule.min) {
      return `Min ${rule.min}`;
    }
    if (num > rule.max) {
      return `Max ${rule.max}`;
    }
    return null;
  };

  const computeOverall = (rec) => {
    let sum = 0;
    for (const f of MARK_FIELDS) {
      const val = rec[f];
      if (val !== '' && val !== null && val !== undefined) {
        const num = Number(val);
        if (!isNaN(num) && num >= 0 && num <= MARK_LIMITS[f].max) {
          sum += num;
        }
      }
    }
    return Math.round(sum * 100) / 100;
  };

  const handleFieldChange = (recordId, field, rawValue) => {
    const error = validateField(field, rawValue);
    const errorKey = `${recordId}_${field}`;

    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (error) {
        updated[errorKey] = error;
      } else {
        delete updated[errorKey];
      }
      return updated;
    });

    setDirtyRecordIds((prev) => new Set(prev).add(recordId));

    setRecords((previousRecords) =>
      previousRecords.map((record) => {
        if (record._id !== recordId) return record;

        const updated = {
          ...record,
          [field]: rawValue
        };

        updated.overallMarks = computeOverall(updated);
        return updated;
      })
    );
  };

  const handleSaveAll = async () => {
    if (dirtyRecordIds.size === 0 || isSavingAll) return;

    // Check all dirty records for errors
    const dirtyList = records.filter((r) => dirtyRecordIds.has(r._id));
    const newErrors = {};
    let firstInvalidId = null;

    for (const rec of dirtyList) {
      for (const field of MARK_FIELDS) {
        const val = rec[field];
        const err = validateField(field, val);
        if (err) {
          const key = `${rec._id}_${field}`;
          newErrors[key] = err;
          if (!firstInvalidId) {
            firstInvalidId = `mark-input-${rec._id}-${field}`;
          }
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...newErrors }));
      setBanner({
        type: 'error',
        text: 'Please fix all highlighted marks before saving. Values must not exceed field limits or be negative.'
      });
      if (firstInvalidId) {
        setTimeout(() => {
          document.getElementById(firstInvalidId)?.focus();
        }, 50);
      }
      return;
    }

    setIsSavingAll(true);
    setBanner(null);

    try {
      const payloadRecords = dirtyList.map((r) => ({
        _id: r._id,
        student: r.student,
        attendanceMarks: r.attendanceMarks === '' ? 0 : Number(r.attendanceMarks),
        assignmentMarks: r.assignmentMarks === '' ? 0 : Number(r.assignmentMarks),
        internalMarks: r.internalMarks === '' ? 0 : Number(r.internalMarks),
        examMarks: r.examMarks === '' ? 0 : Number(r.examMarks),
        mscMarks: r.mscMarks === '' ? 0 : Number(r.mscMarks),
        incentiveMarks: r.incentiveMarks === '' ? 0 : Number(r.incentiveMarks)
      }));

      const res = await API.put('/academic-records/bulk', { records: payloadRecords });

      if (res.data?.records) {
        const returnedMap = new Map(res.data.records.map((r) => [r._id, r]));
        setRecords((prev) =>
          prev.map((r) => {
            if (returnedMap.has(r._id)) {
              const updated = returnedMap.get(r._id);
              return {
                ...r,
                ...updated,
                student:
                  updated.student &&
                  typeof updated.student === 'object' &&
                  updated.student.name
                    ? updated.student
                    : r.student
              };
            }
            return r;
          })
        );
      }

      setDirtyRecordIds(new Set());
      setBanner({
        type: 'success',
        text: `Successfully saved marks for ${payloadRecords.length} student(s)!`
      });
    } catch (err) {
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save academic records.'
      });
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleSaveRecord = async (rec) => {
    // Validate this row
    const rowErrors = {};
    let firstInvalidId = null;

    for (const field of MARK_FIELDS) {
      const val = rec[field];
      const err = validateField(field, val);
      if (err) {
        const key = `${rec._id}_${field}`;
        rowErrors[key] = err;
        if (!firstInvalidId) {
          firstInvalidId = `mark-input-${rec._id}-${field}`;
        }
      }
    }

    if (Object.keys(rowErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...rowErrors }));
      setBanner({
        type: 'error',
        text: `Please fix errors for ${rec.student?.name || 'student'} before saving.`
      });
      if (firstInvalidId) {
        setTimeout(() => {
          document.getElementById(firstInvalidId)?.focus();
        }, 50);
      }
      return;
    }

    setSavingRowId(rec._id);
    try {
      const payload = {
        _id: rec._id,
        attendanceMarks: rec.attendanceMarks === '' ? 0 : Number(rec.attendanceMarks),
        assignmentMarks: rec.assignmentMarks === '' ? 0 : Number(rec.assignmentMarks),
        internalMarks: rec.internalMarks === '' ? 0 : Number(rec.internalMarks),
        examMarks: rec.examMarks === '' ? 0 : Number(rec.examMarks),
        mscMarks: rec.mscMarks === '' ? 0 : Number(rec.mscMarks),
        incentiveMarks: rec.incentiveMarks === '' ? 0 : Number(rec.incentiveMarks)
      };

      const res = await API.put(`/academic-records/${rec._id}`, payload);

      if (res.data?.record) {
        const updated = res.data.record;
        setRecords((previous) =>
          previous.map((r) =>
            r._id === rec._id
              ? {
                  ...r,
                  ...updated,
                  student:
                    updated.student &&
                    typeof updated.student === 'object' &&
                    updated.student.name
                      ? updated.student
                      : r.student
                }
              : r
          )
        );
      }

      setDirtyRecordIds((prev) => {
        const next = new Set(prev);
        next.delete(rec._id);
        return next;
      });

      setFieldErrors((prev) => {
        const next = { ...prev };
        for (const field of MARK_FIELDS) {
          delete next[`${rec._id}_${field}`];
        }
        return next;
      });

      setBanner({
        type: 'success',
        text: `Updated marks for ${rec.student?.name || 'student'}.`
      });
    } catch (err) {
      setBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save academic record.'
      });
    } finally {
      setSavingRowId(null);
    }
  };

  return (
    <div className="academic-page">
      <Navbar />

      <div className="academic-layout">
        <Sidebar />

        <main className="academic-main">
          <div className="academic-page-header">
            <div>
              <h1 className="academic-page-title">
                Academic Performance Ledger
              </h1>

              <p className="academic-page-subtitle">
                Internal marks, assignment evaluations, and examination score tracking
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="academic-controls">
            <div className="academic-controls-left">
              <label
                className="academic-label"
                htmlFor="academic-class"
              >
                Classroom:
              </label>

              <select
                id="academic-class"
                className="academic-class-select"
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.subjectTitle} ({c.classCode})
                  </option>
                ))}
              </select>
            </div>

            {isTeacher && (
              <div className="academic-controls-right">
                <button
                  type="button"
                  className="academic-save-all-btn"
                  onClick={handleSaveAll}
                  disabled={dirtyRecordIds.size === 0 || isSavingAll}
                >
                  <Save size={16} />
                  {isSavingAll
                    ? 'Saving All...'
                    : dirtyRecordIds.size > 0
                    ? `Save All (${dirtyRecordIds.size})`
                    : 'Save All'}
                </button>
              </div>
            )}
          </div>

          {/* Feedback Banner */}
          {banner && (
            <div
              className={`academic-banner academic-banner--${banner.type}`}
              role="alert"
            >
              {banner.type === 'error' ? (
                <AlertCircle size={18} className="academic-banner-icon" />
              ) : (
                <CheckCircle2 size={18} className="academic-banner-icon" />
              )}
              <span>{banner.text}</span>
              <button
                type="button"
                className="academic-banner-close"
                onClick={() => setBanner(null)}
                aria-label="Close message"
              >
                &times;
              </button>
            </div>
          )}

          {isTeacher ? (
            /* Teacher View */
            <div className="academic-teacher-card">
              {loading ? (
                <div className="academic-empty-state">
                  Loading classrooms...
                </div>
              ) : records.length === 0 ? (
                <div className="academic-empty-state">
                  No academic records found for this classroom.
                </div>
              ) : (
                <div className="academic-table-wrapper">
                  <table className="academic-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>
                          Attendance<br />Marks
                          <span className="academic-th-max">(Max 10)</span>
                        </th>
                        <th>
                          Assignment<br />Marks
                          <span className="academic-th-max">(Max 10)</span>
                        </th>
                        <th>
                          Internal<br />Marks
                          <span className="academic-th-max">(Max 20)</span>
                        </th>
                        <th>
                          Final Exam<br />Marks
                          <span className="academic-th-max">(Max 60)</span>
                        </th>
                        <th>
                          MSC<br />Marks
                          <span className="academic-th-max">(Max 20)</span>
                        </th>
                        <th>
                          Incentive<br />Marks
                          <span className="academic-th-max">(Max 10)</span>
                        </th>
                        <th>
                          Overall<br />Marks
                          <span className="academic-th-max">(Max 130)</span>
                        </th>
                        <th className="academic-action-heading">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {records.map((rec) => {
                        const isDirty = dirtyRecordIds.has(rec._id);
                        return (
                          <tr
                            key={rec._id}
                            className={isDirty ? 'academic-row--dirty' : ''}
                          >
                            <td className="academic-student-name">
                              {rec.student?.name}
                              {isDirty && (
                                <span
                                  className="academic-dirty-dot"
                                  title="Unsaved changes"
                                >
                                  •
                                </span>
                              )}
                            </td>

                            {MARK_FIELDS.map((field) => {
                              const err = fieldErrors[`${rec._id}_${field}`];
                              return (
                                <td key={field} className="academic-cell-input">
                                  <div className="academic-input-container">
                                    <input
                                      id={`mark-input-${rec._id}-${field}`}
                                      className={`academic-marks-input ${
                                        err ? 'academic-marks-input--error' : ''
                                      }`}
                                      type="number"
                                      step="any"
                                      min={MARK_LIMITS[field].min}
                                      max={MARK_LIMITS[field].max}
                                      value={rec[field] ?? ''}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          rec._id,
                                          field,
                                          e.target.value
                                        )
                                      }
                                      aria-invalid={!!err}
                                      aria-describedby={
                                        err
                                          ? `err-${rec._id}-${field}`
                                          : undefined
                                      }
                                    />
                                    {err && (
                                      <span
                                        id={`err-${rec._id}-${field}`}
                                        className="academic-field-error"
                                      >
                                        {err}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}

                            <td className="academic-overall-marks">
                              {rec.overallMarks ?? 0}
                            </td>

                            <td className="academic-action-cell">
                              <button
                                type="button"
                                className="academic-save-btn"
                                onClick={() => handleSaveRecord(rec)}
                                disabled={savingRowId === rec._id}
                              >
                                <Save size={14} />
                                {savingRowId === rec._id ? 'Saving...' : 'Save'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Student View */
            <div className="academic-student-card">
              <h2 className="academic-summary-title">
                Your Course Marks Breakdown
              </h2>

              {loading ? (
                <div className="academic-empty-state">
                  Loading academic records...
                </div>
              ) : !studentRecord ? (
                <div className="academic-empty-state">
                  No academic record is available for this class yet.
                </div>
              ) : (
                <>
                  <div className="academic-marks-grid">
                    <MarkBox
                      label="Attendance Marks (Max 10)"
                      value={studentRecord.attendanceMarks ?? 0}
                    />

                    <MarkBox
                      label="Assignment Marks (Max 10)"
                      value={studentRecord.assignmentMarks ?? 0}
                    />

                    <MarkBox
                      label="Internal Test (Max 20)"
                      value={studentRecord.internalMarks ?? 0}
                    />

                    <MarkBox
                      label="Final Exam Marks (Max 60)"
                      value={studentRecord.examMarks ?? 0}
                    />

                    <MarkBox
                      label="MSC Marks (Max 20)"
                      value={studentRecord.mscMarks ?? 0}
                    />

                    <MarkBox
                      label="Incentive Points (Max 10)"
                      value={studentRecord.incentiveMarks ?? 0}
                    />
                  </div>

                  <div className="academic-total-score">
                    <span>Total Score (Max 130)</span>
                    <strong>
                      {studentRecord.overallMarks ?? 0} Marks
                    </strong>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const MarkBox = ({ label, value }) => (
  <div className="academic-mark-box">
    <span className="academic-mark-label">{label}</span>
    <span className="academic-mark-value">{value}</span>
  </div>
);

export default AcademicRecordsPage;
