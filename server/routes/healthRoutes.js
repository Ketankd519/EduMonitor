const express = require('express');
const router = express.Router();
const { success } = require('../utils/apiResponse');

// GET /api/health - basic liveness check, also reports DB connection state
router.get('/', (req, res) => {
  const mongoose = require('mongoose');
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  return success(res, 200, 'EduMonitor API is running', {
    db: dbStates[mongoose.connection.readyState],
    time: new Date().toISOString(),
  });
});

module.exports = router;
