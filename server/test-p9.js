require('dotenv').config();
const express = require('express');
const monitoringRoutes = require('./routes/monitoringRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api/monitoring', monitoringRoutes);
app.use(errorHandler);
app.listen(5568, () => console.log('p9 test server up'));
