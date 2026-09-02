const express = require('express');
const {
  createClass,
  joinClass,
  getMyClasses,
  leaveClass,
  deleteClass
} = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getMyClasses);
router.post('/', authorize('TEACHER'), createClass);
router.post('/join', authorize('STUDENT'), joinClass);
router.post('/:classId/leave', authorize('STUDENT'), leaveClass);
router.delete('/:classId', authorize('TEACHER'), deleteClass);

module.exports = router;