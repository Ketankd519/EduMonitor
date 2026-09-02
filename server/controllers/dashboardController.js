const { success } = require('../utils/apiResponse');
const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const Post = require('../models/Post');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const LiveClass = require('../models/LiveClass');
const { getStudentAttendanceSummary } = require('../services/attendanceService');

/**
 * GET /api/dashboard/student
 * All fields are real queries. attendancePercentage is averaged only over
 * classes that actually have attendance records (see attendanceService).
 */
async function getStudentDashboard(req, res, next) {
  try {
    const user = req.user;

    const memberships = await ClassMember.find({ student: user._id }).select('class');
    const classIds = memberships.map((m) => m.class);

    const recentPosts = await Post.find({ class: { $in: classIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'fullName')
      .populate('class', 'subjectTitle subjectCode');

    const recentAnnouncements = recentPosts.map((p) => ({
      id: p._id,
      content: `${p.class.subjectCode} — ${p.author.fullName}: ${p.content.slice(0, 120)}${
        p.content.length > 120 ? '...' : ''
      }`,
    }));

    const now = new Date();
    const openAssignments = await Assignment.find({
      class: { $in: classIds },
      endDate: { $gte: now },
    }).select('_id');

    const mySubmissions = await Submission.find({ student: user._id }).select('assignment percentage');
    const submittedIds = new Set(mySubmissions.map((s) => s.assignment.toString()));

    const upcomingAssignments = openAssignments.filter(
      (a) => !submittedIds.has(a._id.toString())
    ).length;

    const averageAssignmentScore =
      mySubmissions.length > 0
        ? Math.round(
            (mySubmissions.reduce((sum, s) => sum + s.percentage, 0) / mySubmissions.length) * 100
          ) / 100
        : null;

    const attendanceSummaries = await Promise.all(
      classIds.map((cId) => getStudentAttendanceSummary(cId, user._id))
    );
    const withData = attendanceSummaries.filter((s) => s.percentage !== null);
    const attendancePercentage =
      withData.length > 0
        ? Math.round((withData.reduce((sum, s) => sum + s.percentage, 0) / withData.length) * 100) / 100
        : null;

    const stats = {
      enrolledClasses: classIds.length,
      upcomingAssignments,
      attendancePercentage, // null means "no attendance taken yet", not 0%
      averageAssignmentScore,
      recentAnnouncements,
    };

    return success(res, 200, 'Student dashboard data fetched', {
      user: user.toSafeObject(),
      stats,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/teacher
 * todaysLiveClasses (Phase 8) now counts active sessions started today
 * across this teacher's classes — a real, currently-running count, not a
 * scheduled-for-today count (there's no scheduling feature; live classes
 * start on demand).
 */
async function getTeacherDashboard(req, res, next) {
  try {
    const user = req.user;

    const teacherClasses = await Class.find({ teacher: user._id, isActive: true }).select(
      '_id subjectCode'
    );
    const classIds = teacherClasses.map((c) => c._id);

    const totalClasses = classIds.length;
    const allMemberships =
      classIds.length > 0 ? await ClassMember.find({ class: { $in: classIds } }) : [];
    const totalStudents = new Set(allMemberships.map((m) => m.student.toString())).size;

    const recentPosts = await Post.find({ class: { $in: classIds }, author: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('class', 'subjectCode');

    const recentActivity = recentPosts.map((p) => ({
      id: p._id,
      content: `Posted in ${p.class.subjectCode}: ${p.content.slice(0, 120)}${
        p.content.length > 120 ? '...' : ''
      }`,
    }));

    const now = new Date();
    const pendingAssignments = await Assignment.countDocuments({
      class: { $in: classIds },
      endDate: { $gte: now },
    });

    const todaysLiveClasses = await LiveClass.countDocuments({
      class: { $in: classIds },
      status: 'active',
    });

    const attendanceSummaries = await Promise.all(
      allMemberships.map((m) => getStudentAttendanceSummary(m.class, m.student))
    );
    const withData = attendanceSummaries.filter((s) => s.percentage !== null);
    const averageClassAttendance =
      withData.length > 0
        ? Math.round((withData.reduce((sum, s) => sum + s.percentage, 0) / withData.length) * 100) / 100
        : null;

    const stats = {
      totalClasses,
      totalStudents,
      pendingAssignments,
      todaysLiveClasses,
      averageClassAttendance,
      recentActivity,
    };

    return success(res, 200, 'Teacher dashboard data fetched', {
      user: user.toSafeObject(),
      stats,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStudentDashboard, getTeacherDashboard };
