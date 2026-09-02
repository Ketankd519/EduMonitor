require('dotenv').config();
const express = require('express');
const { protect } = require('./middleware/authMiddleware');
const { authorize } = require('./middleware/roleMiddleware');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.use(express.json());
app.get('/protected', protect, (req, res) => res.json({ success: true }));
app.get('/teacher-only', protect, authorize('teacher'), (req, res) => res.json({ success: true }));
app.use(errorHandler);

app.listen(5556, () => console.log('authmw test server up'));
