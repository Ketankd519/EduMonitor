const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const initializeSocket = require('./services/socketService');
const { configureSecurityMiddleware } = require('./middleware/securityMiddleware');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize WebSockets and attach to express app
const io = initializeSocket(server);
app.set('io', io);

// CORS Whitelisting
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS security policy.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply Helmet & NoSQL injection sanitizers
configureSecurityMiddleware(app);

// Static uploads serving
app.use('/uploads', express.static('uploads'));

// Registered REST Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/academic-records', require('./routes/academicRecordRoutes'));
app.use('/api/live-classes', require('./routes/liveClassRoutes'));
app.use('/api/monitoring', require('./routes/monitoringRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'EduMonitor Express Backend', timestamp: new Date() });
});

// Centralized error boundary
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[EduMonitor Backend] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
