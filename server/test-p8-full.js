require('dotenv').config();
const express = require('express');
const liveClassRoutes = require('./routes/liveClassRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const app = express();
app.use(express.json());
app.use('/api/live-classes', liveClassRoutes);
app.use(errorHandler);
app.listen(5567, () => console.log('full test up'));
