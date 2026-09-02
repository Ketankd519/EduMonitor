require('dotenv').config();
const express = require('express');
const { protect } = require('./middleware/authMiddleware');
const { authorize } = require('./middleware/roleMiddleware');
const { getStudentDashboard, getTeacherDashboard } = require('./controllers/dashboardController');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.use(express.json());
app.get('/api/dashboard/student', protect, authorize('student'), getStudentDashboard);
app.get('/api/dashboard/teacher', protect, authorize('teacher'), getTeacherDashboard);
app.use(errorHandler);
app.listen(5558, () => console.log('dash test server up'));
