const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Question = require('../models/Question');
const Class = require('../models/Class');
const { getIO } = require('../services/socketService');

// @desc    Submit MCQ exam answers and perform automated evaluation
// @route   POST /api/submissions
// @access  Private (Student)
exports.submitAssignment = async (req, res, next) => {
  try {
    const { assignmentId, answers } = req.body; // answers = [{ questionId, selectedOption }]

    if (!assignmentId || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID and answers array are required.'
      });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Examination not found.' });
    }

    const now = new Date();
    const deadline = new Date(assignment.endDate);

    // Count existing attempts for this student
    const existingSubmissions = await Submission.find({
      assignment: assignmentId,
      student: req.user._id
    }).sort({ attemptNumber: -1 });

    const existingCount = existingSubmissions.length;

    // Check retake allowance if student already has submissions
    if (existingCount >= 1) {
      if (!assignment.allowRetake) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this examination and retakes are not allowed.'
        });
      }
      if (now > deadline) {
        return res.status(400).json({
          success: false,
          message: 'The examination deadline has passed. Retakes are no longer permitted.'
        });
      }
    }

    // Deadline check with duration grace (Full duration allowed if started before deadline)
    const maxAllowedSubmissionTime = new Date(
      deadline.getTime() + (assignment.durationMinutes * 60 * 1000) + (5 * 60 * 1000)
    );
    if (now > maxAllowedSubmissionTime) {
      return res.status(400).json({
        success: false,
        message: 'The examination submission window has closed.'
      });
    }

    // Server-side Automated Marking Engine
    const questions = await Question.find({ assignment: assignmentId });
    if (!questions.length) {
      return res.status(400).json({
        success: false,
        message: 'No questions found for this examination.'
      });
    }

    const marksPerQuestion = Number(assignment.marksPerQuestion) > 0
      ? Number(assignment.marksPerQuestion)
      : 1;
    const negativeMarks = Number(assignment.negativeMarks) >= 0
      ? Number(assignment.negativeMarks)
      : 0;

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;
    const evaluatedAnswers = [];

    questions.forEach((q) => {
      const studentAns = answers.find((a) => a.questionId === q._id.toString());
      const rawSelected = studentAns && typeof studentAns.selectedOption === 'string'
        ? studentAns.selectedOption.trim().toUpperCase()
        : null;

      const selectedOption = ['A', 'B', 'C', 'D'].includes(rawSelected) ? rawSelected : null;

      if (!selectedOption) {
        unansweredCount += 1;
        evaluatedAnswers.push({
          question: q._id,
          selectedOption: null,
          isCorrect: false
        });
      } else if (selectedOption === q.correctOption) {
        correctCount += 1;
        totalScore += marksPerQuestion;
        evaluatedAnswers.push({
          question: q._id,
          selectedOption,
          isCorrect: true
        });
      } else {
        incorrectCount += 1;
        totalScore -= negativeMarks;
        evaluatedAnswers.push({
          question: q._id,
          selectedOption,
          isCorrect: false
        });
      }
    });

    // Round score to 2 decimal places to avoid IEEE 754 precision issues
    totalScore = Math.round(totalScore * 100) / 100;
    const maxMarks = Math.round((questions.length * marksPerQuestion) * 100) / 100;
    const percentage = maxMarks > 0 ? Math.max(0, Math.round((totalScore / maxMarks) * 10000) / 100) : 0;
    const nextAttemptNumber = existingCount + 1;

    // Create a new distinct Submission document — never overwrite past submissions
    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user._id,
      answers: evaluatedAnswers,
      score: totalScore,
      maxMarks,
      percentage,
      attemptNumber: nextAttemptNumber,
      correctCount,
      incorrectCount,
      unansweredCount,
      submittedAt: now
    });

    // Do NOT leak correct answers in client response
    const io = req.app?.get?.('io') || getIO();
    if (io) {
      io.to(`user:${req.user._id}`).emit('live-ticker-update', {
        type: 'live-assignment',
        action: 'submitted',
        assignmentId: assignmentId.toString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Examination submitted and evaluated successfully.',
      submission: {
        _id: submission._id,
        score: submission.score,
        maxMarks: submission.maxMarks,
        percentage: submission.percentage,
        attemptNumber: submission.attemptNumber,
        correctCount: submission.correctCount,
        incorrectCount: submission.incorrectCount,
        unansweredCount: submission.unansweredCount,
        submittedAt: submission.submittedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all submissions for an assignment (Teacher view, available only after deadline)
// @route   GET /api/submissions/assignment/:assignmentId
// @access  Private (Teacher)
exports.getAssignmentSubmissions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Examination not found.' });
    }

    const classDoc = await Class.findById(assignment.class);
    if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review submissions for this examination.' });
    }

    const now = new Date();
    if (now <= new Date(assignment.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Student submissions can only be reviewed after the examination deadline has passed.'
      });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'name email')
      .populate('answers.question', 'questionText optionA optionB optionC optionD correctOption marks')
      .sort({ score: -1, submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        totalMarks: assignment.totalMarks,
        marksPerQuestion: assignment.marksPerQuestion,
        negativeMarks: assignment.negativeMarks,
        endDate: assignment.endDate,
        answersReleased: assignment.answersReleased
      },
      submissions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current student's own attempts and reviews
// @route   GET /api/submissions/assignment/:assignmentId/my-submissions
// @access  Private (Student)
exports.getMySubmissions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Examination not found.' });
    }

    const now = new Date();
    const isDeadlinePassed = now > new Date(assignment.endDate);
    const isReleased = Boolean(assignment.answersReleased && isDeadlinePassed);

    const submissions = await Submission.find({
      assignment: assignmentId,
      student: req.user._id
    })
      .populate('answers.question', 'questionText optionA optionB optionC optionD correctOption marks')
      .sort({ attemptNumber: -1 });

    const sanitized = submissions.map((sub) => {
      const obj = sub.toObject();
      if (!isReleased) {
        // Scrub correct answers and correctness flags if answers have not been officially released
        obj.answers = obj.answers.map((ans) => ({
          question: ans.question ? {
            _id: ans.question._id,
            questionText: ans.question.questionText,
            optionA: ans.question.optionA,
            optionB: ans.question.optionB,
            optionC: ans.question.optionC,
            optionD: ans.question.optionD,
            marks: ans.question.marks
          } : null,
          selectedOption: ans.selectedOption
        }));
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      submissions: sanitized,
      answersReleased: isReleased,
      isDeadlinePassed
    });
  } catch (error) {
    next(error);
  }
};