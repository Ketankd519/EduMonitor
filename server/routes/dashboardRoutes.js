const express = require('express');
const router = express.Router();

const { getStudentDashboard, getTeacherDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/student', protect, authorize('student'), getStudentDashboard);
router.get('/teacher', protect, authorize('teacher'), getTeacherDashboard);

module.exports = router;
