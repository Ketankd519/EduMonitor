const express = require('express');
const {
  submitAssignment,
  getAssignmentSubmissions,
  getMySubmissions
} = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('STUDENT'), submitAssignment);
router.get('/assignment/:assignmentId', authorize('TEACHER'), getAssignmentSubmissions);
router.get('/assignment/:assignmentId/my-submissions', authorize('STUDENT'), getMySubmissions);

module.exports = router;