const express = require('express');
const router = express.Router();

const {
  startLiveClass,
  endLiveClass,
  getLiveClassById,
  getActiveLiveClass,
} = require('../controllers/liveClassController');

const { protect } = require('../middleware/authMiddleware');
const { requireClassMember } = require('../middleware/classAccessMiddleware');

router.use(protect);

router.post('/class/:classId/start', requireClassMember('classId'), startLiveClass);
router.get('/class/:classId/active', requireClassMember('classId'), getActiveLiveClass);
router.post('/:liveClassId/end', endLiveClass); // ownership verified inside controller
router.get('/:liveClassId', getLiveClassById); // membership verified inside controller

module.exports = router;
