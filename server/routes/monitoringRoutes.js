const express = require('express');
const router = express.Router();

const { analyzeFrame } = require('../controllers/monitoringController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/analyze-frame', authorize('student'), analyzeFrame);

module.exports = router;
