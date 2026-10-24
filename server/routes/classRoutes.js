const express = require('express');
const {
  createClass,
  joinClass,
  getMyClasses,
  getClassById,
  getClassRoster,
  leaveClass,
  deleteClass
} = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getMyClasses);
router.get('/:classId', getClassById);
router.get('/:classId/roster', authorize('TEACHER'), getClassRoster);
router.post('/', authorize('TEACHER'), createClass);
router.post('/join', authorize('STUDENT'), joinClass);
router.post('/:classId/leave', authorize('STUDENT'), leaveClass);
router.delete('/:classId', authorize('TEACHER'), deleteClass);

module.exports = router;