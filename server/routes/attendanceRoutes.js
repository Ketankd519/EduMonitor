const express = require('express');
const { markAttendance, markAllPresent, getClassAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/class/:classId', getClassAttendance);
router.post('/', authorize('TEACHER'), markAttendance);
router.post('/mark-all-present', authorize('TEACHER'), markAllPresent);

module.exports = router;