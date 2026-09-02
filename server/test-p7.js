require('dotenv').config();
const express = require('express');
const attendanceRoutes = require('./routes/attendanceRoutes');
const academicRecordRoutes = require('./routes/academicRecordRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.use(express.json());
app.use('/api/attendance', attendanceRoutes);
app.use('/api/academic-records', academicRecordRoutes);
app.use(errorHandler);
app.listen(5563, () => console.log('p7 test server up'));
