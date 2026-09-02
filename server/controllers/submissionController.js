const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Question = require('../models/Question');

// @desc    Submit MCQ exam answers and perform automated evaluation
// @route   POST /api/submissions
// @access  Private (Student)
exports.submitAssignment = async (req, res, next) => {
  try {
    const { assignmentId, answers } = req.body; // answers = [{ questionId, selectedOption }]

    if (!assignmentId || !answers) {
      return res.status(400).json({ success: false, message: 'Assignment ID and answer key array required.' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment test not found.' });
    }

    // Check expiration
    if (new Date() > new Date(assignment.endDate)) {
      return res.status(400).json({ success: false, message: 'Assignment submission deadline has expired.' });
    }

    // Prevent duplicate submission if retake disallowed
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user._id
    });

    if (existingSubmission && !assignment.allowRetake) {
      return res.status(400).json({ success: false, message: 'You have already submitted this assignment.' });
    }

    // Server-side Automated Marking Engine
    const questions = await Question.find({ assignment: assignmentId });
    let totalScore = 0;
    const evaluatedAnswers = [];

    questions.forEach((q) => {
      const studentAns = answers.find((a) => a.questionId === q._id.toString());
      const selectedOption = studentAns ? studentAns.selectedOption : null;
      const isCorrect = selectedOption === q.correctOption;

      if (isCorrect) {
        totalScore += q.marks;
      }

      evaluatedAnswers.push({
        question: q._id,
        selectedOption,
        isCorrect
      });
    });

    const percentage = Math.round((totalScore / assignment.totalMarks) * 100);

    // Save or update submission record
    let submission;
    if (existingSubmission && assignment.allowRetake) {
      existingSubmission.answers = evaluatedAnswers;
      existingSubmission.score = totalScore;
      existingSubmission.percentage = percentage;
      existingSubmission.submittedAt = Date.now();
      submission = await existingSubmission.save();
    } else {
      submission = await Submission.create({
        assignment: assignmentId,
        student: req.user._id,
        answers: evaluatedAnswers,
        score: totalScore,
        percentage
      });
    }

    res.status(201).json({
      success: true,
      message: 'Assignment submitted and automatically evaluated.',
      submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all submissions for an assignment (Teacher view)
// @route   GET /api/submissions/assignment/:assignmentId
// @access  Private (Teacher)
exports.getAssignmentSubmissions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'name email')
      .sort({ score: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    next(error);
  }
};