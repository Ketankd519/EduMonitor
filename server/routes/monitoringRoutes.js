const express = require('express');
const {
  logMonitoringEvent,
  getLiveClassMonitoring,
  getLiveClassReport,
  getStudentProgressAnalytics
} = require('../controllers/monitoringController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/event', logMonitoringEvent);
router.get('/live/:liveClassId', authorize('TEACHER'), getLiveClassMonitoring);
router.get('/report/:liveClassId', getLiveClassReport);
router.get('/student/progress', authorize('STUDENT'), getStudentProgressAnalytics);

module.exports = router;