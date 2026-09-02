const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const Post = require('../models/Post');
const Note = require('../models/Note');
const Assignment = require('../models/Assignment');

// Helper function to generate standardized class codes
const generateClassCode = (subjectCode, section) => {
  const sanitizedCode = subjectCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const sanitizedSection = section.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `${sanitizedCode}_${sanitizedSection}`;
};

// @desc    Create a new class (Teacher only)
// @route   POST /api/classes
// @access  Private (Teacher)
exports.createClass = async (req, res, next) => {
  try {
    const { subjectTitle, subjectCode, section } = req.body;

    if (!subjectTitle || !subjectCode || !section) {
      return res.status(400).json({ success: false, message: 'Please provide Subject Title, Subject Code, and Section.' });
    }

    const generatedCode = generateClassCode(subjectCode, section);

    // Check if code collision exists
    const existingClass = await Class.findOne({ classCode: generatedCode });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: `A classroom with code '${generatedCode}' already exists.`
      });
    }

    const newClass = await Class.create({
      subjectTitle,
      subjectCode,
      section,
      classCode: generatedCode,
      teacher: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Classroom created successfully.',
      class: newClass
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a class using class code (Student only)
// @route   POST /api/classes/join
// @access  Private (Student)
exports.joinClass = async (req, res, next) => {
  try {
    const { classCode } = req.body;

    if (!classCode) {
      return res.status(400).json({ success: false, message: 'Please enter a valid Class Code.' });
    }

    const formattedCode = classCode.trim().toUpperCase();
    const classToJoin = await Class.findOne({ classCode: formattedCode }).populate('teacher', 'name email');

    if (!classToJoin) {
      return res.status(444).json({ success: false, message: 'Invalid Class Code. Classroom not found.' });
    }

    // Verify student is not already enrolled
    const existingMember = await ClassMember.findOne({
      class: classToJoin._id,
      student: req.user._id
    });

    if (existingMember) {
      return res.status(400).json({ success: false, message: 'You have already joined this classroom.' });
    }

    await ClassMember.create({
      class: classToJoin._id,
      student: req.user._id
    });

    res.status(200).json({
      success: true,
      message: `Successfully joined ${classToJoin.subjectTitle} (${classToJoin.classCode})`,
      class: classToJoin
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all classes for current user (Teacher created OR Student joined)
// @route   GET /api/classes
// @access  Private
exports.getMyClasses = async (req, res, next) => {
  try {
    let classes = [];

    if (req.user.role === 'TEACHER') {
      classes = await Class.find({ teacher: req.user._id })
        .populate('teacher', 'name email avatar')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'STUDENT') {
      const memberships = await ClassMember.find({ student: req.user._id }).populate({
        path: 'class',
        populate: { path: 'teacher', select: 'name email avatar' }
      });
      classes = memberships.map((m) => m.class).filter(Boolean);
    }

    res.status(200).json({
      success: true,
      count: classes.length,
      classes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a class (Student only)
// @route   POST /api/classes/:classId/leave
// @access  Private (Student)
exports.leaveClass = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const membership = await ClassMember.findOneAndDelete({
      class: classId,
      student: req.user._id
    });

    if (!membership) {
      return res.status(404).json({ success: false, message: 'Enrolled class membership record not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully left the classroom.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete class and cascade remove associated items (Teacher only)
// @route   DELETE /api/classes/:classId
// @access  Private (Teacher)
exports.deleteClass = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const classDoc = await Class.findById(classId);

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Classroom not found.' });
    }

    if (classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this class.' });
    }

    // Cascade deletion across dependent collections
    await Class.findByIdAndDelete(classId);
    await ClassMember.deleteMany({ class: classId });
    await Post.deleteMany({ class: classId });
    await Note.deleteMany({ class: classId });
    await Assignment.deleteMany({ class: classId });

    res.status(200).json({
      success: true,
      message: 'Classroom and associated records deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};