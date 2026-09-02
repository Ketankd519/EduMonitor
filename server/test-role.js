const express = require('express');
const { authorize } = require('./middleware/roleMiddleware');

const app = express();
// Fake a middleware that pretends protect() already ran
app.use((req, res, next) => {
  req.user = { role: req.headers['x-fake-role'] || 'student' };
  next();
});
app.get('/teacher-only', authorize('teacher'), (req, res) => res.json({ success: true }));
app.get('/student-only', authorize('student'), (req, res) => res.json({ success: true }));

app.listen(5557, () => console.log('role test server up'));
