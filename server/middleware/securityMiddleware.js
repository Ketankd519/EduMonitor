const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// Rate limiting to prevent brute-force attacks on sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  }
});

const configureSecurityMiddleware = (app) => {
  // Helmet HTTP security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // Prevent NoSQL injection attacks (sanitizes $ and . from queries)
  app.use(mongoSanitize());

  // Apply general API rate limiting
  app.use('/api', apiLimiter);
};

module.exports = {
  authLimiter,
  apiLimiter,
  configureSecurityMiddleware
};