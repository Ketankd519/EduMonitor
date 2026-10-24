const express = require('express');
const router = express.Router();

// 1. Exactly match the function names we just created in authController.js
const { 
  register, 
  login, 
  getMe,
  checkEmail, 
  updatePassword 
} = require('../controllers/authController');

// Auth middleware for the getMe route:
const { protect } = require('../middleware/authMiddleware');

// 2. Standard Auth Routes
router.post('/register', register);
router.post('/login', login);

// 3. New Forgot Password Routes
router.post('/check-email', checkEmail);
router.post('/update-password', updatePassword);

// 4. Get Current User Route
router.get('/me', protect, getMe);

module.exports = router;