import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import botRoutes from './routes/bots';
import conversationRoutes from './routes/conversations';
import documentRoutes from './routes/documents';
import analyticsRoutes from './routes/analytics';
import leadRoutes from './routes/leads';
import integrationRoutes from './routes/integrations';
import subscriptionRoutes from './routes/subscriptions';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import chatRoutes from './routes/chat';

// Middleware
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
const frontendOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header)
      if (!origin) return callback(null, true);
      if (frontendOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bots', botRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/chat', chatRoutes); // Public chat endpoint

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`ðŸš€ API Server running on port ${PORT}`);
  console.log(`ðŸ“ Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
