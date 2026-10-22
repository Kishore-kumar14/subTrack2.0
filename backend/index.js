import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB, { isDBConnected, getDBDetails } from './config/db.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import authRoutes from './routes/authRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize MongoDB connection
connectDB();

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or tools with no origin header
    if (!origin) return callback(null, true);
    if (
      origin === 'https://subtrack20-frontend.vercel.app' ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));
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
  const emailProvider = process.env.RESEND_API_KEY
    ? 'Resend API'
    : (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
      ? `${process.env.SMTP_HOST} (SMTP)`
      : 'Unconfigured / Fallback';

  res.json({
    status: 'ok',
    service: 'SubTrack Backend API',
    timestamp: new Date().toISOString(),
    mongodb: dbInfo,
    email: {
      provider: emailProvider,
      configured: Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)),
      diagnosticEndpoint: '/api/auth/email-diagnostic'
    }
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
      emailDiagnostic: '/api/auth/email-diagnostic',
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
