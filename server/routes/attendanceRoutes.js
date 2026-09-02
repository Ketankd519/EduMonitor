const express = require('express');
const { markAttendance, getClassAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/class/:classId', getClassAttendance);
router.post('/', authorize('TEACHER'), markAttendance);

module.exports = router;