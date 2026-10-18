import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB, { isDBConnected, getDBDetails } from './config/db.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import authRoutes from './routes/authRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize MongoDB connection
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger for API calls
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbInfo = getDBDetails();
  res.json({
    status: 'ok',
    service: 'SubTrack Backend API',
    timestamp: new Date().toISOString(),
    mongodb: dbInfo
  });
});

// Routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/catalog', catalogRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    message: 'SubTrack Backend API with MongoDB is active.',
    endpoints: {
      health: '/api/health',
      subscriptions: '/api/subscriptions',
      auth: '/api/auth',
      calendar: '/api/calendar',
      catalog: '/api/catalog'
    }
  });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 SubTrack Backend Server is running on port ${PORT}`);
  console.log(`🔗 Local URL:   http://localhost:${PORT}`);
  console.log(`📡 Health URL:  http://localhost:${PORT}/api/health`);
  console.log(`==================================================\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down SubTrack backend server...');
  server.close(() => {
    process.exit(0);
  });
});

export default app;
