import express from 'express';
import authRoutes from './routes/authRoutes.js';
import botRoutes from './routes/botRoutes.js';
import geminiRoutes from './routes/geminiRoutes.js';
import escrowRoutes from './routes/escrowRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import customRequestRoutes from './routes/customRequestRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import { apiLimiter, burstLimiter, botShieldMiddleware } from './middleware/rateLimiter.js';
import { inputSanitizerMiddleware } from './middleware/sanitizer.js';

const app = express();

// Trust proxy settings for Cloud Run / reverse proxies
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));

// Apply Input Sanitizer, Anti-Cache Headers, Bot Shield WAF headers and rate limiters to all /api routes
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});
app.use('/api', inputSanitizerMiddleware);
app.use('/api', botShieldMiddleware);
app.use('/api', burstLimiter);
app.use('/api', apiLimiter);

// --- MOUNT MODULAR ROUTE HANDLERS ---
app.use(authRoutes);
app.use(botRoutes);
app.use(geminiRoutes);
app.use(escrowRoutes);
app.use(adminRoutes);
app.use(paymentRoutes);
app.use(listingRoutes);
app.use(orderRoutes);
app.use(messageRoutes);
app.use(customRequestRoutes);
app.use(supportRoutes);

// Global API 404 handler for unmatched /api routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global API Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express Global API Error:', err);
  if ((res as any).headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: typeof err === 'string' ? err : (err?.message || 'A server error occurred.')
  });
});

export default app;
