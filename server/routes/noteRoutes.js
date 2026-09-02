const express = require('express');
const { uploadNote, getClassNotes, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.get('/class/:classId', getClassNotes);
router.post('/', authorize('TEACHER'), upload.single('file'), uploadNote);
router.delete('/:noteId', authorize('TEACHER'), deleteNote);

module.exports = router;