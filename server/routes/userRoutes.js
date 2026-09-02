const express = require('express');
const { getDashboardSummary, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', protect, getDashboardSummary);
router.put('/profile', protect, updateProfile);

module.exports = router;