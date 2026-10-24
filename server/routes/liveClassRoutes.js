const express = require('express');
const {
  startLiveClass,
  getActiveLiveClass,
  getClassLiveSessions,
  endLiveClass,
  getStudentLiveTicker
} = require('../controllers/liveClassController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/live-ticker', getStudentLiveTicker);
router.get('/active/:classId', getActiveLiveClass);
router.get('/class/:classId', authorize('TEACHER'), getClassLiveSessions);
router.post('/start', authorize('TEACHER'), startLiveClass);
router.post('/end/:id', authorize('TEACHER'), endLiveClass);
router.post('/:id/end', authorize('TEACHER'), endLiveClass);

module.exports = router;
