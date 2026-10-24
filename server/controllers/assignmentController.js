const Assignment = require('../models/Assignment');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const { getIO } = require('../services/socketService');

// @desc    Create a new MCQ Assignment with Questions (Teacher only)
// @route   POST /api/assignments
// @access  Private (Teacher)
exports.createAssignment = async (req, res, next) => {
  try {
    const {
      classId,
      title,
      description,
      durationMinutes,
      startDate,
      endDate,
      allowRetake,
      marksPerQuestion,
      negativeMarks,
      questions
    } = req.body;

    if (!classId || !title || !durationMinutes || !startDate || !endDate || !questions || !questions.length) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields and add at least one question.'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start or end date/time format.'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date/time must be after the start date/time.'
      });
    }

    const durationNum = Number(durationMinutes);
    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be a positive number of minutes.'
      });
    }

    const marksNum = Number(marksPerQuestion);
    const parsedMarksPerQuestion = (!isNaN(marksNum) && marksNum > 0) ? marksNum : 1;

    const negNum = Number(negativeMarks);
    const parsedNegativeMarks = (!isNaN(negNum) && negNum >= 0) ? negNum : 0;

    // Verify teacher owns the class
    const classDoc = await Class.findById(classId);
    if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create examinations for this classroom.'
      });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText?.trim() || !q.optionA?.trim() || !q.optionB?.trim() || !q.optionC?.trim() || !q.optionD?.trim()) {
        return res.status(400).json({
          success: false,
          message: `Question #${i + 1} is missing statement or option fields.`
        });
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) {
        return res.status(400).json({
          success: false,
          message: `Question #${i + 1} must specify a valid correct option (A, B, C, or D).`
        });
      }
    }

    const totalMarks = Math.round((questions.length * parsedMarksPerQuestion) * 100) / 100;

    const assignment = await Assignment.create({
      class: classId,
      title: title.trim(),
      description: description ? description.trim() : '',
      durationMinutes: durationNum,
      startDate: start,
      endDate: end,
      totalMarks,
      marksPerQuestion: parsedMarksPerQuestion,
      negativeMarks: parsedNegativeMarks,
      allowRetake: Boolean(allowRetake),
      answersReleased: false
    });

    const questionDocs = questions.map((q) => ({
      assignment: assignment._id,
      questionText: q.questionText.trim(),
      optionA: q.optionA.trim(),
      optionB: q.optionB.trim(),
      optionC: q.optionC.trim(),
      optionD: q.optionD.trim(),
      correctOption: q.correctOption,
      marks: parsedMarksPerQuestion
    }));

    await Question.insertMany(questionDocs);

    const io = req.app?.get?.('io') || getIO();
    if (io) {
      // Broadcast globally so all connected student panels refresh their live ticker
      io.emit('live-ticker-update', {
        type: 'live-assignment',
        action: 'created',
        classId: classId.toString(),
        assignmentId: assignment._id.toString()
      });

      ClassMember.find({ class: classId })
        .select('student')
        .then((members) => {
          members.forEach((m) => {
            io.to(`user:${m.student}`).emit('live-ticker-update', {
              type: 'live-assignment',
              action: 'created',
              classId: classId.toString(),
              assignmentId: assignment._id.toString()
            });
          });
        })
        .catch((err) => console.error('Error emitting live-ticker assignment create:', err));
    }

    res.status(201).json({
      success: true,
      message: 'MCQ Examination published successfully.',
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

    const now = new Date();

    if (req.user.role === 'TEACHER') {
      const assignmentsWithMeta = await Promise.all(
        assignments.map(async (assign) => {
          const submissionCount = await Submission.countDocuments({ assignment: assign._id });
          const isDeadlinePassed = now > new Date(assign.endDate);

          return {
            ...assign.toObject(),
            submissionCount,
            hasSubmissions: submissionCount > 0,
            isDeadlinePassed
          };
        })
      );

      return res.status(200).json({
        success: true,
        count: assignmentsWithMeta.length,
        assignments: assignmentsWithMeta
      });
    }

    // Student role
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assign) => {
        // Fetch all student submissions sorted by highest score first, then newest
        const submissions = await Submission.find({
          assignment: assign._id,
          student: req.user._id
        }).sort({ score: -1, submittedAt: -1 });

        const bestSubmission = submissions.length > 0 ? submissions[0] : null;
        const isDeadlinePassed = now > new Date(assign.endDate);
        const canRetake = Boolean(assign.allowRetake && !isDeadlinePassed);
        const answersReleased = Boolean(assign.answersReleased && isDeadlinePassed);

        return {
          ...assign.toObject(),
          userSubmission: bestSubmission || null,
          attemptCount: submissions.length,
          isDeadlinePassed,
          canRetake,
          answersReleased
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

// @desc    Get single assignment details & questions for exam session or review
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Examination not found.' });
    }

    const now = new Date();
    const isDeadlinePassed = now > new Date(assignment.endDate);

    if (req.user.role === 'TEACHER') {
      const classDoc = await Class.findById(assignment.class);
      if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this examination.' });
      }

      const questions = await Question.find({ assignment: assignment._id }).sort({ createdAt: 1 });
      const submissionCount = await Submission.countDocuments({ assignment: assignment._id });

      return res.status(200).json({
        success: true,
        assignment,
        questions,
        submissionCount,
        hasSubmissions: submissionCount > 0,
        isDeadlinePassed
      });
    }

    // Student role
    const submissions = await Submission.find({
      assignment: assignment._id,
      student: req.user._id
    }).sort({ score: -1, submittedAt: -1 });

    const bestSubmission = submissions.length > 0 ? submissions[0] : null;
    const canRetake = Boolean(assignment.allowRetake && !isDeadlinePassed);
    const answersReleased = Boolean(assignment.answersReleased && isDeadlinePassed);

    // If deadline passed and student never submitted
    if (isDeadlinePassed && submissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The deadline for this examination has passed. New attempts are closed.'
      });
    }

    // If student already submitted and cannot retake
    if (submissions.length > 0 && !canRetake) {
      // Check if student wants to review answers after release
      if (answersReleased) {
        // Populate questions with correctOption
        const questionsWithCorrect = await Question.find({ assignment: assignment._id }).sort({ createdAt: 1 });
        return res.status(200).json({
          success: true,
          assignment,
          questions: questionsWithCorrect,
          userSubmission: bestSubmission,
          mySubmissions: submissions,
          canRetake: false,
          answersReleased: true,
          alreadyCompleted: true
        });
      }

      // If answers NOT released, student can only view their score summary
      const questionsSanitized = (await Question.find({ assignment: assignment._id }).sort({ createdAt: 1 }))
        .map((q) => {
          const obj = q.toObject();
          delete obj.correctOption;
          return obj;
        });

      return res.status(200).json({
        success: true,
        assignment,
        questions: questionsSanitized,
        userSubmission: bestSubmission,
        mySubmissions: submissions,
        canRetake: false,
        answersReleased: false,
        alreadyCompleted: true
      });
    }

    // Active exam taking mode (before submission or starting a permitted retake before deadline)
    const questions = await Question.find({ assignment: assignment._id }).sort({ createdAt: 1 });
    const sanitizedQuestions = questions.map((q) => {
      const obj = q.toObject();
      delete obj.correctOption;
      return obj;
    });

    res.status(200).json({
      success: true,
      assignment,
      questions: sanitizedQuestions,
      userSubmission: bestSubmission || null,
      mySubmissions: submissions,
      canRetake,
      answersReleased: false,
      alreadyCompleted: false
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update examination details & questions (Teacher only)
// @route   PUT /api/assignments/:id
// @access  Private (Teacher)
exports.updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Examination not found.' });
    }

    const classDoc = await Class.findById(assignment.class);
    if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this examination.' });
    }

    const {
      title,
      description,
      durationMinutes,
      startDate,
      endDate,
      allowRetake,
      marksPerQuestion,
      negativeMarks,
      questions
    } = req.body;

    const submissionCount = await Submission.countDocuments({ assignment: assignment._id });
    const hasSubmissions = submissionCount > 0;

    // Validate dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid start or end date/time.' });
      }
      if (end <= start) {
        return res.status(400).json({ success: false, message: 'End date/time must be after the start date/time.' });
      }
      assignment.startDate = start;
      assignment.endDate = end;
    }

    if (title && title.trim()) {
      assignment.title = title.trim();
    }
    if (description !== undefined) {
      assignment.description = description ? description.trim() : '';
    }
    if (durationMinutes) {
      const dur = Number(durationMinutes);
      if (dur > 0) assignment.durationMinutes = dur;
    }
    if (allowRetake !== undefined) {
      assignment.allowRetake = Boolean(allowRetake);
    }

    if (hasSubmissions) {
      // Approved Policy: Lock questions and grading scheme when student submissions already exist
      if (questions || marksPerQuestion !== undefined || negativeMarks !== undefined) {
        // If teacher sent modified questions, ignore question changes to prevent invalidating existing results
      }
      await assignment.save();
      return res.status(200).json({
        success: true,
        message: 'Examination settings updated. Questions and marking were locked because student submissions already exist.',
        assignment
      });
    }

    // No submissions exist yet: teacher can edit questions, marksPerQuestion, and negativeMarks
    if (marksPerQuestion !== undefined) {
      const m = Number(marksPerQuestion);
      if (!isNaN(m) && m > 0) assignment.marksPerQuestion = m;
    }
    if (negativeMarks !== undefined) {
      const n = Number(negativeMarks);
      if (!isNaN(n) && n >= 0) assignment.negativeMarks = n;
    }

    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText?.trim() || !q.optionA?.trim() || !q.optionB?.trim() || !q.optionC?.trim() || !q.optionD?.trim()) {
          return res.status(400).json({
            success: false,
            message: `Question #${i + 1} is missing statement or option fields.`
          });
        }
        if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) {
          return res.status(400).json({
            success: false,
            message: `Question #${i + 1} must specify a valid correct option (A, B, C, or D).`
          });
        }
      }

      // Replace questions
      await Question.deleteMany({ assignment: assignment._id });
      const questionDocs = questions.map((q) => ({
        assignment: assignment._id,
        questionText: q.questionText.trim(),
        optionA: q.optionA.trim(),
        optionB: q.optionB.trim(),
        optionC: q.optionC.trim(),
        optionD: q.optionD.trim(),
        correctOption: q.correctOption,
        marks: assignment.marksPerQuestion
      }));
      await Question.insertMany(questionDocs);

      assignment.totalMarks = Math.round((questions.length * assignment.marksPerQuestion) * 100) / 100;
    }

    await assignment.save();

    const io = req.app?.get?.('io') || getIO();
    if (io) {
      // Broadcast globally so all connected student panels refresh their live ticker
      io.emit('live-ticker-update', {
        type: 'live-assignment',
        action: 'updated',
        classId: assignment.class.toString(),
        assignmentId: assignment._id.toString()
      });

      ClassMember.find({ class: assignment.class })
        .select('student')
        .then((members) => {
          members.forEach((m) => {
            io.to(`user:${m.student}`).emit('live-ticker-update', {
              type: 'live-assignment',
              action: 'updated',
              classId: assignment.class.toString(),
              assignmentId: assignment._id.toString()
            });
          });
        })
        .catch((err) => console.error('Error emitting live-ticker assignment update:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Examination updated successfully.',
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Release correct answers to students after deadline (Teacher only)
// @route   PUT /api/assignments/:id/release-answers
// @access  Private (Teacher)
exports.releaseAnswers = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Examination not found.' });
    }

    const classDoc = await Class.findById(assignment.class);
    if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to release answers for this examination.' });
    }

    const now = new Date();
    if (now <= new Date(assignment.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Correct answers can only be released after the examination deadline has passed.'
      });
    }

    const { release } = req.body;
    assignment.answersReleased = release !== undefined ? Boolean(release) : true;
    await assignment.save();

    res.status(200).json({
      success: true,
      message: assignment.answersReleased
        ? 'Correct answers have been released to students.'
        : 'Correct answers have been hidden from students.',
      answersReleased: assignment.answersReleased
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

    const classDoc = await Class.findById(assignment.class);
    if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this examination.' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    await Question.deleteMany({ assignment: req.params.id });
    await Submission.deleteMany({ assignment: req.params.id });

    const io = req.app?.get?.('io') || getIO();
    if (io) {
      // Broadcast globally so all connected student panels refresh their live ticker
      io.emit('live-ticker-update', {
        type: 'live-assignment',
        action: 'deleted',
        classId: assignment.class.toString(),
        assignmentId: assignment._id.toString()
      });

      ClassMember.find({ class: assignment.class })
        .select('student')
        .then((members) => {
          members.forEach((m) => {
            io.to(`user:${m.student}`).emit('live-ticker-update', {
              type: 'live-assignment',
              action: 'deleted',
              classId: assignment.class.toString(),
              assignmentId: assignment._id.toString()
            });
          });
        })
        .catch((err) => console.error('Error emitting live-ticker assignment delete:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Examination and all related student submissions have been removed.'
    });
  } catch (error) {
    next(error);
  }
};