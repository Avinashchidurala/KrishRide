import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config, validateEnvironment } from './config/environment';
import { initializeRedis } from './config/redis';

// Validate environment variables
validateEnvironment();

// Initialize Redis
initializeRedis();

const app = express();

// ============================================================================
// Middleware Setup
// ============================================================================
// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());
app.use(morgan('combined'));
// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // In development, allow all localhost origins for easier testing
    if (config.nodeEnv === 'development') {
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.corsOrigin,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5174',
      'http://10.0.2.2:8081', // Android emulator accessing Expo dev server
      'http://10.0.2.2:3000', // Android emulator accessing backend directly
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors());

app.use(express.json())

// Handle preflight requests explicitly
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'HushRyd API is running' });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'HushRyd API v1', version: '1.0.0' });
});

// Import routes
import authRoutes from './routes/auth';
import publicRoutes from './routes/public';
import driverRoutes from './routes/drivers';
import userRoutes from './routes/users';
import rideRoutes from './routes/rides';
import bookingRoutes from './routes/bookings';
import walletRoutes from './routes/wallet';
import referralRoutes from './routes/referrals';
import addressRoutes from './routes/addresses';
import uploadRoutes from './routes/upload';
import sosRoutes from './routes/sos';
import adminRoutes from './routes/admin';
import paymentRoutes from './routes/payments';
import ratingsRoutes from './routes/ratings';
import complaintsRoutes from './routes/complaints';
import supportRoutes from './routes/support';
import notificationRoutes from './routes/notifications';
import emergencyContactsRoutes from './routes/emergency-contacts';
import driverEarningsRoutes from './routes/driver-earnings';
import chatRoutes from './routes/chat';
import { startIdleDetection } from './services/idleDetection';
import { startBookingCleanup } from './services/bookingCleanup';

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/emergency-contacts', emergencyContactsRoutes);
app.use('/api/driver-earnings', driverEarningsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Import error handlers
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

const PORT = config.port;

// Create HTTP server
const httpServer = createServer(app);

// Start idle detection service
startIdleDetection();

// Start booking cleanup service (cancels unpaid bookings)
startBookingCleanup();

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🌐 CORS Origin: ${config.corsOrigin}`);
  console.log(`⏱️  Idle detection service started`);
  console.log(`🧹 Booking cleanup service started`);
});

