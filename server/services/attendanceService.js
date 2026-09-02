const Attendance = require('../models/Attendance');

/**
 * Computes a student's attendance summary for one class from real
 * Attendance documents — never a stored/cached percentage that could
 * drift out of sync with the underlying records.
 */
async function getStudentAttendanceSummary(classId, studentId) {
  const records = await Attendance.find({ class: classId, student: studentId });

  const totalClasses = records.length;
  const present = records.filter((r) => r.status === 'present').length;
  const absent = totalClasses - present;
  const percentage = totalClasses > 0 ? Math.round((present / totalClasses) * 10000) / 100 : null;

  return { totalClasses, present, absent, percentage };
}

module.exports = { getStudentAttendanceSummary };
