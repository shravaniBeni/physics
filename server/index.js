const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const experimentRoutes = require('./routes/experiments');
const userProgressRoutes = require('./routes/userProgress');
const quizRoutes = require('./routes/quiz');
const gamificationRoutes = require('./routes/gamification');
const aiRoutes = require('./routes/ai');
const hardwareRoutes = require('./routes/hardware');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB (non-blocking)
connectDB().then(connected => {
  if (connected) {
    console.log('✅ Database features enabled');
  } else {
    console.log('⚠️  Running in database-free mode (AI features still available)');
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware to check database connection for database-dependent routes
const checkDatabaseConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database temporarily unavailable',
      suggestion: 'Please check your MongoDB connection or try again later'
    });
  }
  next();
};

// Routes
app.use('/api/auth', checkDatabaseConnection, authRoutes);
app.use('/api/experiments', checkDatabaseConnection, experimentRoutes);
app.use('/api/user-progress', checkDatabaseConnection, userProgressRoutes);
app.use('/api/quiz', checkDatabaseConnection, quizRoutes);
app.use('/api/gamification', checkDatabaseConnection, gamificationRoutes);
app.use('/api/hardware', checkDatabaseConnection, hardwareRoutes);
app.use('/api/ai', aiRoutes); // AI routes can work without database

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatusText[dbStatus] || 'unknown',
      connected: dbStatus === 1
    },
    ai: {
      configured: require('./services/aiService').isConfigured()
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Physics Pocket Lab API ready!`);
});