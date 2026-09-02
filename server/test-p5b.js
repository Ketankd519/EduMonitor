require('dotenv').config();
const express = require('express');
const commentRoutes = require('./routes/commentRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.use(express.json());
app.use('/api/comments', commentRoutes);
app.use(errorHandler);
app.listen(5561, () => console.log('p5b test server up'));
