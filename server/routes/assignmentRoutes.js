const express = require('express');
const {
  createAssignment,
  getClassAssignments,
  getAssignmentById,
  updateAssignment,
  releaseAnswers,
  deleteAssignment
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/class/:classId', getClassAssignments);
router.get('/:id', getAssignmentById);
router.post('/', authorize('TEACHER'), createAssignment);
router.put('/:id', authorize('TEACHER'), updateAssignment);
router.put('/:id/release-answers', authorize('TEACHER'), releaseAnswers);
router.delete('/:id', authorize('TEACHER'), deleteAssignment);

module.exports = router;