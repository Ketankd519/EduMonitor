const express = require('express');
const {
  submitAssignment,
  getAssignmentSubmissions
} = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('STUDENT'), submitAssignment);
router.get('/assignment/:assignmentId', authorize('TEACHER'), getAssignmentSubmissions);

module.exports = router;