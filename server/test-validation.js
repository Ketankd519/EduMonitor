const express = require('express');
const { registerValidation, loginValidation } = require('./middleware/validateMiddleware');

const app = express();
app.use(express.json());
app.post('/test-register', registerValidation, (req, res) => res.json({ success: true, message: 'passed validation' }));
app.post('/test-login', loginValidation, (req, res) => res.json({ success: true, message: 'passed validation' }));

app.listen(5555, () => console.log('validation test server up'));
