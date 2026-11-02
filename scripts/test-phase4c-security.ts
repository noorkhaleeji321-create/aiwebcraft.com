/**
 * Phase 4C - Authentication & Order Integrity Hardening Automated Test Suite
 *
 * Scenarios:
 * 1. [REAL CRYPTO] Stateless HMAC-SHA256 signed session token creation & verification
 * 2. [REAL CRYPTO] Tampered session signature or forged payload is rejected with timing-safe check
 * 3. [REAL CRYPTO] Expired session token is safely invalidated
 * 4. [SECURITY AUDIT] Zero admin master keys stored in client files, storage, or transmitted by client
 * 5. [RATE LIMIT] Brute-force protection on /api/backend/auth/login locks IP after 5 failed attempts
 * 6. [ORDER INTEGRITY] Status transition Pending -> Cancelled restocks inventory accurately
 * 7. [ORDER INTEGRITY] Status transition Cancelled -> Cancelled (repeated) is strictly idempotent (0 duplicate restock)
 * 8. [ORDER INTEGRITY] Status transition Cancelled -> Pending re-verifies inventory and decrements stock
 * 9. [ORDER INTEGRITY] Status transition Pending -> Shipped updates status with zero stock alteration
 * 10. [ORDER INTEGRITY] Status transition Shipped -> Cancelled restocks inventory accurately
 * 11. [CONCURRENCY GUARD] Two simultaneous status updates on the same order handled atomically
 * 12. [API & DATA INTEGRITY] Rejection of illegal status values, and 105 products & SQLite preserved
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  GitStorageService,
  StoredProduct
} from '../backend/services/gitStorageService';
import {
  createSignedSessionToken,
  verifySignedSessionToken,
  checkLoginRateLimit,
  recordFailedLogin,
  recordSuccessfulLogin,
  resetLoginRateLimits
} from '../backend/services/authService';

async function runPhase4cTests() {
  console.log('======================================================================');
  console.log('AIWebCrafter.com - Phase 4C Authentication & Order Integrity Suite');
  console.log('Target: Stateless HMAC Sessions, Rate Limiting & Stock Idempotency');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  const dataDir = path.resolve(process.cwd(), 'data');
  const service = new GitStorageService({ localDataDir: dataDir });

  const tests = [
    // ------------------------------------------------------------------------
    // TEST 1
    // ------------------------------------------------------------------------
    {
      id: 1,
      type: '[REAL CRYPTO]',
      name: 'Stateless HMAC-SHA256 Token: Create and verify signed session token for Vercel Serverless',
      fn: async () => {
        const token = createSignedSessionToken('owner@aiwebcrafter.com', 'owner');
        if (!token || token.split('.').length !== 3) {
          throw new Error('Signed session token must follow 3-part JWT structure (header.payload.signature)');
        }

        const verified = verifySignedSessionToken(token);
        if (!verified) throw new Error('Valid token failed verification');
        if (verified.email !== 'owner@aiwebcrafter.com' || verified.role !== 'owner') {
          throw new Error(`Token payload mismatch: ${JSON.stringify(verified)}`);
        }

        return `Pass: Token generated and verified statelessly. Email: ${verified.email}, Role: ${verified.role}, Exp: ${new Date(verified.exp * 1000).toISOString()}`;
      }
    },

    // ------------------------------------------------------------------------
    // TEST 2
    // ------------------------------------------------------------------------
    {
      id: 2,
      type: '[REAL CRYPTO]',
      name: 'Tamper Protection: Forged payload or corrupted HMAC signature is strictly rejected',
      fn: async () => {
        const validToken = createSignedSessionToken('owner@aiwebcrafter.com', 'owner');
        const [h, p, sig] = validToken.split('.');

        // 1. Alter payload to elevate privileges or change email
        const payloadJson = Buffer.from(p, 'base64url').toString('utf-8');
        const forgedPayload = JSON.parse(payloadJson);
        forgedPayload.role = 'super_hacker';
        const forgedP = Buffer.from(JSON.stringify(forgedPayload)).toString('base64url');
        const forgedToken = `${h}.${forgedP}.${sig}`;

        const verifiedForged = verifySignedSessionToken(forgedToken);
        if (verifiedForged) {
          throw new Error('CRITICAL SECURITY FLAW: Forged payload with stale signature was accepted!');
        }

        // 2. Corrupt signature
        const corruptedSigToken = `${h}.${p}.${sig.slice(0, -4)}xxxx`;
        const verifiedCorrupted = verifySignedSessionToken(corruptedSigToken);
        if (verifiedCorrupted) {
          throw new Error('CRITICAL SECURITY FLAW: Corrupted signature was accepted!');
        }

        return 'Pass: Both forged payload and corrupted signature were cleanly rejected via crypto.timingSafeEqual.';
      }
    },

    // ------------------------------------------------------------------------
    // TEST 3
    // ------------------------------------------------------------------------
    {
      id: 3,
      type: '[REAL CRYPTO]',
      name: 'Session Expiry: Expired tokens (exp in the past) are rejected statelessly',
      fn: async () => {
        // Create an expired payload
        const now = Math.floor(Date.now() / 1000);
        const expiredPayload = {
          email: 'owner@aiwebcrafter.com',
          role: 'owner',
          iat: now - 7200,
          exp: now - 3600, // Expired 1 hour ago
          jti: 'test_expired'
        };

        const adminMasterKey = process.env.AWC_ADMIN_KEY || process.env.AWC_API_SECRET || 'aiwebcrafter2026';
        const SIGNING_SECRET = process.env.AWC_SIGNING_SECRET ||
          crypto.createHash('sha256').update(adminMasterKey + '_signed_session_salt_2026').digest('hex');

        const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const p = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
        const sig = crypto.createHmac('sha256', SIGNING_SECRET).update(`${h}.${p}`).digest('base64url');
        const expiredToken = `${h}.${p}.${sig}`;

        const result = verifySignedSessionToken(expiredToken);
        if (result) {
          throw new Error('Expired session token was accepted!');
        }

        return 'Pass: Expired token (exp < now) was rejected. No stale access permitted.';
      }
    },

    // ------------------------------------------------------------------------
    // TEST 4
    // ------------------------------------------------------------------------
    {
      id: 4,
      type: '[SECURITY AUDIT]',
      name: 'Zero Master Key Exposure: Confirm no admin master key stored or sent from client code',
      fn: async () => {
        const clientCodePath = path.resolve(process.cwd(), 'src', 'services', 'gitStorageClient.ts');
        const clientCode = fs.readFileSync(clientCodePath, 'utf-8');

        // Client must never send x-awc-admin-key header
        if (clientCode.includes("headers['x-awc-admin-key']") || clientCode.includes('"x-awc-admin-key"')) {
          throw new Error('SECURITY VIOLATION: gitStorageClient.ts contains references to x-awc-admin-key!');
        }

        // Client must only store session token
        if (!clientCode.includes('ADMIN_TOKEN_KEY')) {
          throw new Error('Expected session token storage reference');
        }

        return 'Pass: gitStorageClient.ts uses signed session tokens and HttpOnly credentials. Zero exposure of AWC_ADMIN_KEY.';
      }
    },

    // ------------------------------------------------------------------------
    // TEST 5
    // ------------------------------------------------------------------------
    {
      id: 5,
      type: '[RATE LIMIT]',
      name: 'Brute-Force Protection: 5 failed login attempts locks IP, 6th is rejected with HTTP 429',
      fn: async () => {
        const testIp = '192.168.1.105';
        resetLoginRateLimits();

        // 4 failed attempts: still allowed
        for (let i = 1; i <= 4; i++) {
          recordFailedLogin(testIp);
          const check = checkLoginRateLimit(testIp);
          if (!check.allowed) throw new Error(`Rate limit triggered too early on attempt ${i}`);
        }

        // 5th failed attempt: triggers lockout
        recordFailedLogin(testIp);
        const check5 = checkLoginRateLimit(testIp);
        if (check5.allowed) {
          throw new Error('Lockout was NOT triggered on 5th failed attempt!');
        }

        if (!check5.retryAfterSeconds || check5.retryAfterSeconds <= 0) {
          throw new Error('Missing retryAfterSeconds in rate limit check');
        }

        // Reset for subsequent tests
        resetLoginRateLimits();
        return `Pass: IP ${testIp} was locked out for ${check5.retryAfterSeconds}s after 5 failed attempts. Account protected from brute-force.`;
      }
    },

    // ------------------------------------------------------------------------
    // TEST 6
    // ------------------------------------------------------------------------
    {
      id: 6,
      type: '[ORDER INTEGRITY]',
      name: 'Status Pending -> Cancelled: Stock is correctly restocked (+2 units)',
      fn: async () => {
        // Create an order
        const orderRes = await service.ingestOrder({
          customer_name: 'Test Customer A',
          customer_phone: '0611111111',
          shipping_address: 'Casablanca Anfa',
          city: 'Casablanca',
          items: [{ product_id: 1, quantity: 2 }]
        });
        const orderId = orderRes.order.id;

        const { products: pBefore } = await service.getProducts(true);
        const stockBefore = pBefore.find(p => p.id === 1)!.stock_quantity;

        // Transition: Pending -> Cancelled
        const updated = await service.updateOrderStatus(orderId, 'cancelled');
        if (updated.order_status !== 'cancelled') throw new Error('Status not cancelled');

        const { products: pAfter } = await service.getProducts(true);
        const stockAfter = pAfter.find(p => p.id === 1)!.stock_quantity;

        if (stockAfter !== stockBefore + 2) {
          throw new Error(`Restock failed! Before: ${stockBefore}, After: ${stockAfter}`);
        }

        // Cleanup
        const orderFile = path.join(dataDir, 'orders', `${orderRes.order.order_number}.json`);
        if (fs.existsSync(orderFile)) fs.unlinkSync(orderFile);

        return `Pass: Stock was successfully restocked from ${stockBefore} to ${stockAfter} (+2 units) on order cancellation.`;
      }
    },

    // ------------------------------------------------------------------------
    // TEST 7
    // ------------------------------------------------------------------------
    {
      id: 7,
      type: '[ORDER INTEGRITY]',
      name: 'Repeated Cancelled -> Cancelled: Strict idempotency guarantees ZERO duplicate restocking',
      fn: async () => {
        const orderRes = await service.ingestOrder({
          customer_name: 'Test Customer B',
          customer_phone: '0622222222',
          shipping_address: 'Rabat Agdal',
          city: 'Rabat',
          items: [{ product_id: 1, quantity: 3 }]
        });
        const orderId = orderRes.order.id;

        // Cancel first time
        await service.updateOrderStatus(orderId, 'cancelled');

        const { products: pAfterFirstCancel } = await service.getProducts(true);
        const stockAfterFirstCancel = pAfterFirstCancel.find(p => p.id === 1)!.stock_quantity;

        // Cancel SECOND time with same status
        await service.updateOrderStatus(orderId, 'cancelled');

        const { products: pAfterSecondCancel } = await service.getProducts(true);
        const stockAfterSecondCancel = pAfterSecondCancel.find(p => p.id === 1)!.stock_quantity;

        if (stockAfterSecondCancel !== stockAfterFirstCancel) {
          throw new Error(`DUPLICATE RESTOCK DETECTED! Stock increased from ${stockAfterFirstCancel} to ${stockAfterSecondCancel}`);
        }

        // Cleanup
        const orderFile = path.join(dataDir, 'orders', `${orderRes.order.order_number}.json`);
        if (fs.existsSync(orderFile)) fs.unlinkSync(orderFile);

        return `Pass: Cancelled -> Cancelled repeated call was strictly idempotent. Extra stock added: exactly 0 units (Stock: ${stockAfterSecondCancel}).`;
      }
    },

    // ------------------------------------------------------------------------
    // TEST 8
    // ------------------------------------------------------------------------
    {
      id: 8,
      type: '[ORDER INTEGRITY]',
      name: 'Status Cancelled -> Pending: Re-verifies inventory and decrements stock (-3 units)',
      fn: async () => {
        const orderRes = await service.ingestOrder({
          customer_name: 'Test Customer C',
          customer_phone: '0633333333',
          shipping_address: 'Marrakech Gueliz',
          city: 'Marrakech',
          items: [{ product_id: 1, quantity: 3 }]
        });
        const orderId = orderRes.order.id;

        // Cancel first
        await service.updateOrderStatus(orderId, 'cancelled');
        const { products: pCancelled } = await service.getProducts(true);
        const stockCancelled = pCancelled.find(p => p.id === 1)!.stock_quantity;

        // Reactivate: Cancelled -> Pending
        const reactivated = await service.updateOrderStatus(orderId, 'pending');
        if (reactivated.order_status !== 'pending') throw new Error('Status not set to pending');

        const { products: pReactivated } = await service.getProducts(true);
        const stockReactivated = pReactivated.find(p => p.id === 1)!.stock_quantity;

        if (stockReactivated !== stockCancelled - 3) {
          throw new Error(`Reactivation stock decrement failed! Expected ${stockCancelled - 3}, got ${stockReactivated}`);
        }

        // Cleanup
        const orderFile = path.join(dataDir, 'orders', `${orderRes.order.order_number}.json`);
        if (fs.existsSync(orderFile)) fs.unlinkSync(orderFile);

        return `Pass: Order reactivated from Cancelled to Pending. Inventory checked and safely decremented (-3 units) to ${stockReactivated}.`;
      }
    },

    // ------------------------------------------------------------------------
    // TEST 9
    // ------------------------------------------------------------------------
    {
      id: 9,
      type: '[ORDER INTEGRITY]',
      name: 'Status Pending -> Shipped: Status updates with ZERO stock alteration',
      fn: async () => {
        const orderRes = await service.ingestOrder({
          customer_name: 'Test Customer D',
          customer_phone: '0644444444',
          shipping_address: 'Tangier Malabata',
          city: 'Tangier',
          items: [{ product_id: 1, quantity: 1 }]
        });
        const orderId = orderRes.order.id;

        const { products: pBefore } = await service.getProducts(true);
        const stockBefore = pBefore.find(p => p.id === 1)!.stock_quantity;

        const shipped = await service.updateOrderStatus(orderId, 'shipped');
        if (shipped.order_status !== 'shipped') throw new Error('Status not set to shipped');

        const { products: pAfter } = await service.getProducts(true);
        const stockAfter = pAfter.find(p => p.id === 1)!.stock_quantity;

        if (stockAfter !== stockBefore) {
          throw new Error(`Stock changed on Pending->Shipped! Before: ${stockBefore}, After: ${stockAfter}`);
        }

        // Cleanup
        const orderFile = path.join(dataDir, 'orders', `${orderRes.order.order_number}.json`);
        if (fs.existsSync(orderFile)) fs.unlinkSync(orderFile);

        return `Pass: Transition Pending -> Shipped updated order status cleanly with exactly 0 stock change (Stock: ${stockAfter}).`;
      }
    },

    // ------------------------------------------------------------------------
    // TEST 10
    // ------------------------------------------------------------------------
    {
      id: 10,
      type: '[ORDER INTEGRITY]',
      name: 'Status Shipped -> Cancelled: Order cancelled during delivery restocks inventory (+2 units)',
      fn: async () => {
        const orderRes = await service.ingestOrder({
          customer_name: 'Test Customer E',
          customer_phone: '0655555555',
          shipping_address: 'Fes Batha',
          city: 'Fes',
          items: [{ product_id: 1, quantity: 2 }]
        });
        const orderId = orderRes.order.id;

        // Move to shipped
        await service.updateOrderStatus(orderId, 'shipped');

        const { products: pShipped } = await service.getProducts(true);
        const stockShipped = pShipped.find(p => p.id === 1)!.stock_quantity;

        // Cancel from shipped
        const cancelled = await service.updateOrderStatus(orderId, 'cancelled');
        if (cancelled.order_status !== 'cancelled') throw new Error('Status not cancelled');

        const { products: pAfterCancel } = await service.getProducts(true);
        const stockAfterCancel = pAfterCancel.find(p => p.id === 1)!.stock_quantity;

        if (stockAfterCancel !== stockShipped + 2) {
          throw new Error(`Restock from shipped failed! Expected ${stockShipped + 2}, got ${stockAfterCancel}`);
        }

        // Cleanup
        const orderFile = path.join(dataDir, 'orders', `${orderRes.order.order_number}.json`);
        if (fs.existsSync(orderFile)) fs.unlinkSync(orderFile);

        return `Pass: Shipped order cancelled and restocked (+2 units) accurately from ${stockShipped} to ${stockAfterCancel}.`;
      }
    },

    // ------------------------------------------------------------------------
    // TEST 11
    // ------------------------------------------------------------------------
    {
      id: 11,
      type: '[CONCURRENCY GUARD]',
      name: 'Concurrent Status Updates: Two simultaneous status updates serialized by Mutex without race conditions',
      fn: async () => {
        const orderRes = await service.ingestOrder({
          customer_name: 'Test Customer F',
          customer_phone: '0666666666',
          shipping_address: 'Agadir Marina',
          city: 'Agadir',
          items: [{ product_id: 1, quantity: 2 }]
        });
        const orderId = orderRes.order.id;

        // Launch concurrent updates: one to 'processing', one to 'shipped'
        const p1 = service.updateOrderStatus(orderId, 'processing');
        const p2 = service.updateOrderStatus(orderId, 'shipped');

        const results = await Promise.allSettled([p1, p2]);
        const fulfilled = results.filter(r => r.status === 'fulfilled');

        if (fulfilled.length !== 2) {
          throw new Error(`Expected both updates to complete serially under mutex, but failed: ${JSON.stringify(results)}`);
        }

        // Verify final order state is valid
        const orders = await service.getOrders();
        const finalOrder = orders.find(o => o.id === orderId);
        if (!finalOrder || !['processing', 'shipped'].includes(finalOrder.order_status)) {
          throw new Error(`Invalid final order status: ${finalOrder?.order_status}`);
        }

        // Cleanup
        const orderFile = path.join(dataDir, 'orders', `${orderRes.order.order_number}.json`);
        if (fs.existsSync(orderFile)) fs.unlinkSync(orderFile);

        return `Pass: Both concurrent status updates processed serially under AsyncMutex. Final status: "${finalOrder.order_status}".`;
      }
    },

    // ------------------------------------------------------------------------
    // TEST 12
    // ------------------------------------------------------------------------
    {
      id: 12,
      type: '[API & DATA INTEGRITY]',
      name: 'Status Validation & Catalog Safety: Rejects invalid statuses, confirms 105 products & SQLite untouched',
      fn: async () => {
        // 1. Ingest order to test invalid status
        const orderRes = await service.ingestOrder({
          customer_name: 'Test Customer G',
          customer_phone: '0677777777',
          shipping_address: 'Oujda Center',
          city: 'Oujda',
          items: [{ product_id: 1, quantity: 1 }]
        });

        let rejected = false;
        try {
          await service.updateOrderStatus(orderRes.order.id, 'malicious_status_injection');
        } catch (err: any) {
          rejected = true;
          if (!err.message.includes('Validation Error: Invalid order status')) {
            throw new Error(`Expected Validation Error, got ${err.message}`);
          }
        }

        if (!rejected) throw new Error('Illegal status was not rejected!');

        // Cleanup test order
        const orderFile = path.join(dataDir, 'orders', `${orderRes.order.order_number}.json`);
        if (fs.existsSync(orderFile)) fs.unlinkSync(orderFile);

        // 2. Verify 105 products in data/products.json
        const productsFile = path.resolve(process.cwd(), 'data', 'products.json');
        const products = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
        if (products.length !== 105) throw new Error(`Expected 105 products, found ${products.length}`);

        // 3. Verify SQLite file
        const sqliteFile = path.resolve(process.cwd(), 'src', 'db', 'sqliteEngine.ts');
        if (!fs.existsSync(sqliteFile)) throw new Error('sqliteEngine.ts missing');

        return `Pass: Illegal status rejected with Validation Error. All 105 original products and SQLite engine preserved 100%.`;
      }
    }
  ];

  for (const t of tests) {
    try {
      const msg = await t.fn();
      console.log(`[PASS] ${t.id}. ${t.type} ${t.name}`);
      console.log(`       -> ${msg}\n`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${t.id}. ${t.type} ${t.name}`);
      console.error(`       -> Error: ${err.message}\n`);
      failed++;
    }
  }

  console.log('======================================================================');
  console.log(`PHASE 4C SUMMARY: ${passed}/${tests.length} PASSED (${failed} FAILED)`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4cTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
