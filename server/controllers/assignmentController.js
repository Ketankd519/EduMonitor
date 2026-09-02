const Assignment = require('../models/Assignment');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const Class = require('../models/Class');

// @desc    Create a new MCQ Assignment with Questions (Teacher only)
// @route   POST /api/assignments
// @access  Private (Teacher)
exports.createAssignment = async (req, res, next) => {
  try {
    const { classId, title, description, durationMinutes, startDate, endDate, allowRetake, questions } = req.body;

    if (!classId || !title || !durationMinutes || !startDate || !endDate || !questions || !questions.length) {
      return res.status(400).json({ success: false, message: 'Please fill in all assignment fields and add at least one question.' });
    }

    // Verify teacher owns the class
    const classDoc = await Class.findById(classId);
    if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to create assignments for this classroom.' });
    }

    const totalMarks = questions.reduce((acc, q) => acc + (Number(q.marks) || 1), 0);

    const assignment = await Assignment.create({
      class: classId,
      title,
      description,
      durationMinutes: Number(durationMinutes),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalMarks,
      allowRetake: Boolean(allowRetake)
    });

    // Bulk insert questions linked to assignment
    const questionDocs = questions.map((q) => ({
      assignment: assignment._id,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      marks: Number(q.marks) || 1
    }));

    await Question.insertMany(questionDocs);

    res.status(201).json({
      success: true,
      message: 'MCQ Assignment published successfully.',
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all assignments for a specific class
// @route   GET /api/assignments/class/:classId
// @access  Private
exports.getClassAssignments = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const assignments = await Assignment.find({ class: classId }).sort({ createdAt: -1 });

    // Fetch user submission statuses if student
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assign) => {
        const submission = await Submission.findOne({
          assignment: assign._id,
          student: req.user._id
        });

        return {
          ...assign.toObject(),
          userSubmission: submission || null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: assignmentsWithStatus.length,
      assignments: assignmentsWithStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single assignment details & questions for exam session
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment test not found.' });
    }

    const questions = await Question.find({ assignment: assignment._id });

    // For students, scrub the correct answer key before sending payload
    const sanitizedQuestions = questions.map((q) => {
      const obj = q.toObject();
      if (req.user.role === 'STUDENT') {
        delete obj.correctOption;
      }
      return obj;
    });

    const submission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id
    });

    res.status(200).json({
      success: true,
      assignment,
      questions: sanitizedQuestions,
      userSubmission: submission || null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete assignment and related questions/submissions (Teacher only)
// @route   DELETE /api/assignments/:id
// @access  Private (Teacher)
exports.deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    await Question.deleteMany({ assignment: req.params.id });
    await Submission.deleteMany({ assignment: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Assignment test and submissions removed.'
    });
  } catch (error) {
    next(error);
  }
};