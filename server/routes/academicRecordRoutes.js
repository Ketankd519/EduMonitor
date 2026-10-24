const express = require('express');
const {
  getAcademicRecords,
  updateAcademicRecord,
  bulkUpdateAcademicRecords
} = require('../controllers/academicRecordController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/class/:classId', getAcademicRecords);
router.put('/bulk', authorize('TEACHER'), bulkUpdateAcademicRecords);
router.put('/:recordId', authorize('TEACHER'), updateAcademicRecord);

module.exports = router;
