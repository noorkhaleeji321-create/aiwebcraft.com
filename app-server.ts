import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { gitStorage } from './backend/services/gitStorageService';

dotenv.config({ override: true });

import {
  createSignedSessionToken,
  verifySignedSessionToken,
  parseCookieHeader,
  checkLoginRateLimit,
  recordFailedLogin,
  recordSuccessfulLogin,
  getAdminMasterKey,
  getAdminEmail,
  getSigningSecret,
  isProductionMode,
  SESSION_TTL_SECONDS
} from './backend/services/authService';

export function createApp() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Compress all HTTP response bodies (Gzip / Deflate) to drastically relieve network payload size
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));

  // CORS Configuration using AWC_ALLOWED_ORIGIN (with trailing-slash normalization)
  const allowedOrigins = (process.env.AWC_ALLOWED_ORIGIN || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const rawOrigin = (req.headers['origin'] as string) || '';
    const origin = rawOrigin ? rawOrigin.trim().replace(/\/+$/, '') : '';
    if (origin) {
      const isAllowed = allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        allowedOrigins.some(o => o.replace(/\/+$/, '') === origin);

      if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', rawOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-awc-session-token, x-awc-admin-key, x-awc-storefront-key, x-idempotency-key'
    );

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Admin Authentication Middleware (Stateless HMAC & HttpOnly Cookie)
  const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
    const cookieHeader = req.headers['cookie'];
    const cookies = parseCookieHeader(typeof cookieHeader === 'string' ? cookieHeader : undefined);
    const rawAuth = req.headers['authorization'];
    const authHeader = typeof rawAuth === 'string' ? rawAuth : '';
    const sessionToken =
      cookies['awc_session'] ||
      (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') ||
      (req.headers['x-awc-session-token'] as string);

    // 1. Verify stateless HMAC-SHA256 session token
    if (sessionToken) {
      const verified = verifySignedSessionToken(sessionToken);
      if (verified) {
        (req as any).user = verified;
        return next();
      }
    }

    // 2. Direct server-to-server admin key (strictly for backend CLI or webhooks)
    try {
      const adminMasterKey = getAdminMasterKey();
      const headerAdminKey = (req.headers['x-awc-admin-key'] as string) || (req.headers['x-awc-api-key'] as string);
      if (headerAdminKey && headerAdminKey === adminMasterKey) {
        return next();
      }
    } catch {}

    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Valid administrator session required to access this resource.'
    });
  };

  // --------------------------------------------------------------------------
  // ADMIN AUTHENTICATION ENDPOINTS
  // --------------------------------------------------------------------------

  // Login (Protected by rate limiting & issuing HttpOnly Cookie + Signed Token)
  app.post('/api/backend/auth/login', (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown_ip';
    const rateCheck = checkLoginRateLimit(clientIp);

    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many failed login attempts. Account temporarily locked. Try again in ${rateCheck.retryAfterSeconds} seconds.`
      });
    }

    let validEmail: string;
    let validPassword: string;

    try {
      validEmail = getAdminEmail();
      validPassword = getAdminMasterKey();
    } catch (configErr: any) {
      return res.status(500).json({
        success: false,
        error: configErr.message || 'Server Misconfigured: Required administrator credentials are missing.'
      });
    }

    const { email, password } = req.body || {};

    if (
      email &&
      typeof email === 'string' &&
      email.trim().toLowerCase() === validEmail &&
      password === validPassword
    ) {
      recordSuccessfulLogin(clientIp);
      const token = createSignedSessionToken(validEmail, 'owner');

      // Set HttpOnly, SameSite=Strict cookie (and Secure in production/HTTPS)
      const isSecure = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
      const secureAttr = isSecure ? '; Secure' : '';

      res.setHeader(
        'Set-Cookie',
        `awc_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}${secureAttr}`
      );

      return res.json({
        success: true,
        token,
        user: { email: validEmail, role: 'owner' },
        expires_in: SESSION_TTL_SECONDS
      });
    }

    recordFailedLogin(clientIp);
    return res.status(401).json({
      success: false,
      error: 'Invalid administrator credentials.'
    });
  });

  // Logout (Clears session cookie)
  app.post('/api/backend/auth/logout', (req: Request, res: Response) => {
    const isSecure = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
    const secureAttr = isSecure ? '; Secure' : '';
    res.setHeader('Set-Cookie', `awc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureAttr}`);
    return res.json({
      success: true,
      message: 'Administrator logged out successfully.'
    });
  });

  // --------------------------------------------------------------------------
  // STATIC MEDIA SERVING FOR PERMANENT IMAGES (/media/products/*)
  // --------------------------------------------------------------------------
  app.get('/media/products/:filename', (req: Request, res: Response) => {
    const filename = String(req.params.filename || '');
    // Prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.resolve(process.cwd(), 'media', 'products', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Media file not found' });
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.sendFile(filePath);
  });

  // --------------------------------------------------------------------------
  // PERMANENT STORAGE API (GitHub-Backed & Local Git Store)
  // --------------------------------------------------------------------------

  // Status and Telemetry
  app.get('/api/backend/storage/status', async (_req: Request, res: Response) => {
    try {
      const status = await gitStorage.getStatus();
      return res.json({
        success: true,
        engine: 'github_backed_permanent_storage',
        data: status
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Catalog Products Read (Public or Storefront)
  app.get('/api/backend/storage/products', async (_req: Request, res: Response) => {
    try {
      const { products, sha, fromCache } = await gitStorage.getProducts();
      return res.json({
        success: true,
        data: {
          items: products,
          total: products.length,
          git_sha: sha,
          from_cache: fromCache
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create Product (Admin Only)
  app.post('/api/backend/storage/products', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const newProduct = await gitStorage.createProduct(req.body);
      return res.status(201).json({ success: true, data: newProduct });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  // Update Product (Admin Only)
  app.put('/api/backend/storage/products/:id', requireAdminAuth, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    try {
      const updated = await gitStorage.updateProduct(id, req.body);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  // Delete Product (Admin Only)
  app.delete('/api/backend/storage/products/:id', requireAdminAuth, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    try {
      const result = await gitStorage.deleteProduct(id);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  // Clear All Sample Products (Admin Only)
  app.delete('/api/backend/storage/products/clear-sample/all', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const result = await gitStorage.clearProducts();
      return res.json({ success: true, message: 'Sample products cleared.', cleared_count: result.cleared_count });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Clear All Sample Orders (Admin Only)
  app.delete('/api/backend/storage/orders/clear-sample/all', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const result = await gitStorage.clearOrders();
      return res.json({ success: true, message: 'Sample orders cleared.', cleared_count: result.cleared_count });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Order Ingestion (Public store customer checkout - Mutex Guard, Server total calculation, Atomic)
  app.post('/api/backend/storage/orders', async (req: Request, res: Response) => {
    try {
      const idempotencyKey = (req.headers['x-idempotency-key'] as string) || req.body.idempotency_key;
      const result = await gitStorage.ingestOrder({
        ...req.body,
        idempotency_key: idempotencyKey
      });
      return res.status(result.is_duplicate ? 200 : 201).json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // STOREFRONT DIRECT COMPATIBILITY ENDPOINTS (Plug-and-play for external store)
  // --------------------------------------------------------------------------
  app.get('/api/storefront/ping', async (req: Request, res: Response) => {
    const key = (req.headers['x-awc-storefront-key'] as string) || (req.query.key as string);
    const configuredKey = process.env.AWC_STOREFRONT_KEY;
    const isKeyValid = Boolean(configuredKey && key === configuredKey);
    const { products } = await gitStorage.getProducts();
    return res.json({
      success: true,
      status: 'online',
      platform: 'AIWebCrafter Cloud Platform',
      store: 'Natural Health Morocco',
      key_authenticated: isKeyValid,
      allowed_origins: allowedOrigins,
      products_count: products.length,
      timestamp: new Date().toISOString()
    });
  });
  app.get('/api/products', async (_req: Request, res: Response) => {
    try {
      const { products } = await gitStorage.getProducts();
      return res.json(products);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/categories', async (_req: Request, res: Response) => {
    try {
      const catPath = path.resolve(process.cwd(), 'data', 'categories.json');
      if (fs.existsSync(catPath)) {
        const cats = JSON.parse(fs.readFileSync(catPath, 'utf8'));
        return res.json(cats);
      }
      return res.json([]);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/bootstrap', async (_req: Request, res: Response) => {
    try {
      const { products } = await gitStorage.getProducts();
      const catPath = path.resolve(process.cwd(), 'data', 'categories.json');
      const categories = fs.existsSync(catPath) ? JSON.parse(fs.readFileSync(catPath, 'utf8')) : [];
      return res.json({
        success: true,
        data: {
          products,
          categories,
          storeSettings: {
            store_name: "Natural Health Morocco",
            currency: "MAD"
          }
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const idempotencyKey = (req.headers['x-idempotency-key'] as string) || req.body.idempotency_key;
      const result = await gitStorage.ingestOrder({
        ...req.body,
        idempotency_key: idempotencyKey
      });
      return res.status(result.is_duplicate ? 200 : 201).json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  // Get Orders List (Admin Only - Protected)
  app.get('/api/backend/storage/orders', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const orders = await gitStorage.getOrders();
      return res.json({ success: true, count: orders.length, data: orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete Order (Admin Only - Protected)
  app.delete('/api/backend/storage/orders/:id', requireAdminAuth, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    try {
      const result = await gitStorage.deleteOrder(id);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  // Update Order Status & Adjust Inventory (Admin Only - Protected)
  app.put('/api/backend/storage/orders/:id/status', requireAdminAuth, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ success: false, error: 'Status string is required.' });
    }
    try {
      const updatedOrder = await gitStorage.updateOrderStatus(id, status);
      return res.json({ success: true, data: updatedOrder });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  // Create Snapshot Backup (Admin Only - Protected)
  app.post('/api/backend/storage/backup', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const result = await gitStorage.createSnapshot(req.body.label || 'manual');
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Restore Snapshot (Admin Only - Protected)
  app.post('/api/backend/storage/restore', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const result = await gitStorage.restoreFromSnapshot(req.body.filename);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // STOREFRONT V1 COMPATIBILITY (Aliased for natural-health-morocco)
  // --------------------------------------------------------------------------
  app.get('/api/v1/ping', async (req: Request, res: Response) => {
    const key = (req.headers['x-awc-storefront-key'] as string) || (req.query.key as string);
    const configuredKey = process.env.AWC_STOREFRONT_KEY;
    const isKeyValid = Boolean(configuredKey && key === configuredKey);
    const { products } = await gitStorage.getProducts();
    return res.json({
      success: true,
      status: 'online',
      platform: 'AIWebCrafter Cloud Platform',
      store: 'Natural Health Morocco',
      key_authenticated: isKeyValid,
      products_count: products.length,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/v1/products', async (_req: Request, res: Response) => {
    try {
      const { products } = await gitStorage.getProducts();
      return res.json({ success: true, data: products });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/categories', async (_req: Request, res: Response) => {
    try {
      const catPath = path.resolve(process.cwd(), 'data', 'categories.json');
      const categories = fs.existsSync(catPath) ? JSON.parse(fs.readFileSync(catPath, 'utf8')) : [];
      return res.json({ success: true, data: categories });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/bootstrap', async (_req: Request, res: Response) => {
    try {
      const { products } = await gitStorage.getProducts();
      const catPath = path.resolve(process.cwd(), 'data', 'categories.json');
      const categories = fs.existsSync(catPath) ? JSON.parse(fs.readFileSync(catPath, 'utf8')) : [];
      return res.json({
        success: true,
        data: {
          products,
          categories,
          storeSettings: {
            store_name: "Natural Health Morocco",
            currency: "MAD"
          }
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/v1/orders', async (_req: Request, res: Response) => {
    try {
      const orders = await gitStorage.getOrders();
      return res.json({ success: true, count: orders.length, data: orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/v1/orders', async (req: Request, res: Response) => {
    try {
      const idempotencyKey = (req.headers['x-idempotency-key'] as string) || req.body.idempotency_key;
      const result = await gitStorage.ingestOrder({
        ...req.body,
        idempotency_key: idempotencyKey
      });
      return res.status(result.is_duplicate ? 200 : 201).json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/orders', async (_req: Request, res: Response) => {
    try {
      const orders = await gitStorage.getOrders();
      return res.json({ success: true, count: orders.length, data: orders });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Catch-all for unmatched /api/* routes to strictly return JSON instead of SPA HTML
  app.all('/api/*', (req: Request, res: Response) => {
    return res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.path}`
    });
  });

  return app;
}

export const app = createApp();

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Mount Vite dev server in middleware mode for local development
  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AIWebCrafter] Secure server running on http://0.0.0.0:${PORT}`);
  });
}

// Auto-start server when executed directly in non-serverless environment
if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  startServer().catch((err: unknown) => {
    console.error('[AIWebCrafter] Failed to start server:', err);
    process.exit(1);
  });
}
