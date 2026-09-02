require('dotenv').config();
const express = require('express');
const classRoutes = require('./routes/classRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.use(express.json());
app.use('/api/classes', classRoutes);
app.use(errorHandler);
app.listen(5559, () => console.log('class test server up'));
