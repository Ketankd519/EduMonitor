const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Attendance = require('../models/Attendance');
const LiveClass = require('../models/LiveClass');
const Post = require('../models/Post');

// @desc    Get dashboard metrics & statistics for logged-in user
// @route   GET /api/users/dashboard
// @access  Private
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    if (role === 'STUDENT') {
      // Find classes student has joined
      const memberships = await ClassMember.find({ student: userId }).select('class');
      const classIds = memberships.map((m) => m.class);

      const totalClasses = classIds.length;

      // Count upcoming assignments
      const upcomingAssignmentsCount = await Assignment.countDocuments({
        class: { $in: classIds },
        endDate: { $gte: new Date() }
      });

      // Calculate attendance percentage
      const totalAttendanceRecords = await Attendance.countDocuments({ student: userId });
      const presentAttendanceRecords = await Attendance.countDocuments({
        student: userId,
        status: 'PRESENT'
      });
      const attendancePercentage = totalAttendanceRecords > 0
        ? Math.round((presentAttendanceRecords / totalAttendanceRecords) * 100)
        : 100;

      // Calculate average assignment percentage
      const submissions = await Submission.find({ student: userId }).select('percentage');
      const avgScore = submissions.length > 0
        ? Math.round(submissions.reduce((acc, curr) => acc + curr.percentage, 0) / submissions.length)
        : 0;

      // Fetch recent announcements/posts from joined classes
      const recentPosts = await Post.find({ class: { $in: classIds } })
        .populate('author', 'name role avatar')
        .populate('class', 'subjectTitle subjectCode section')
        .sort({ createdAt: -1 })
        .limit(5);

      return res.status(200).json({
        success: true,
        summary: {
          totalClasses,
          upcomingAssignments: upcomingAssignmentsCount,
          attendancePercentage,
          avgAssignmentScore: avgScore,
          academicPerformance: avgScore >= 75 ? 'Excellent' : avgScore >= 50 ? 'Good' : 'Needs Improvement'
        },
        recentPosts
      });
    } else if (role === 'TEACHER') {
      // Find classes created by teacher
      const teacherClasses = await Class.find({ teacher: userId }).select('_id');
      const classIds = teacherClasses.map((c) => c._id);

      const totalClasses = classIds.length;

      // Count total enrolled students across all classes
      const totalStudents = await ClassMember.countDocuments({ class: { $in: classIds } });

      // Count active assignments
      const activeAssignments = await Assignment.countDocuments({
        class: { $in: classIds },
        endDate: { $gte: new Date() }
      });

      // Count today's live classes
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todayLiveClasses = await LiveClass.countDocuments({
        hostTeacher: userId,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      // Calculate class average attendance
      const totalAttendanceRecords = await Attendance.countDocuments({ class: { $in: classIds } });
      const presentAttendanceRecords = await Attendance.countDocuments({
        class: { $in: classIds },
        status: 'PRESENT'
      });
      const avgAttendance = totalAttendanceRecords > 0
        ? Math.round((presentAttendanceRecords / totalAttendanceRecords) * 100)
        : 100;

      return res.status(200).json({
        success: true,
        summary: {
          totalClasses,
          totalStudents,
          pendingAssignments: activeAssignments,
          todayLiveClasses,
          avgAttendance
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user and profile information
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const { name, avatar, phone, college, department, rollNumber, semester, employeeId, designation } = req.body;

    // Update User base document
    const user = await User.findById(userId);
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    await user.save();

    let updatedProfile;
    if (role === 'STUDENT') {
      updatedProfile = await StudentProfile.findOneAndUpdate(
        { user: userId },
        { phone, college, department, rollNumber, semester },
        { new: true, upsert: true }
      );
    } else if (role === 'TEACHER') {
      updatedProfile = await TeacherProfile.findOneAndUpdate(
        { user: userId },
        { phone, college, department, employeeId, designation },
        { new: true, upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
      profile: updatedProfile
    });
  } catch (error) {
    next(error);
  }
};