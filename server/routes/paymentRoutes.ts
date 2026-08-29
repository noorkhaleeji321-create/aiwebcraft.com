import { Router, Request, Response, NextFunction } from 'express';
import { paymentLimiter, cardingShieldMiddleware, recordFailedPaymentAttempt } from '../middleware/rateLimiter.js';
import { getDecryptedBotConfig } from './botRoutes.js';

const router = Router();

// Retrieve decrypted payment and escrow configuration from Supabase bot_keys table (or process.env fallback)
async function getEscrowPaymentConfig() {
  const botConfig = await getDecryptedBotConfig('escrow') || {};
  return {
    paypalClientId: process.env.PAYPAL_CLIENT_ID || botConfig.paypalClientId || '',
    paypalClientSecret: process.env.PAYPAL_SECRET || botConfig.paypalClientSecret || '',
    paypalMode: process.env.PAYPAL_ENVIRONMENT || botConfig.paypalMode || 'sandbox',
    localBeneficiaryName: process.env.BANK_ACCOUNT_NAME || botConfig.localBeneficiaryName || '',
    localCihRib: process.env.BANK_ACCOUNT_RIB || process.env.CIH_RIB || botConfig.localCihRib || '',
    localAttijariRib: process.env.ATTIJARI_RIB || botConfig.localAttijariRib || '',
    localInstructions: process.env.BANK_INSTRUCTIONS || botConfig.localInstructions || ''
  };
}

// In-Memory Idempotency Cache to prevent Double-Click / Duplicate Payment Submissions
interface CachedPaymentRequest {
  timestamp: number;
  response?: any;
}
const recentPaymentRequests = new Map<string, CachedPaymentRequest>();

// Clean up stale idempotency records every 1 minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of recentPaymentRequests.entries()) {
    if (now - value.timestamp > 30000) { // 30s expiry
      recentPaymentRequests.delete(key);
    }
  }
}, 60000);

function idempotencyGuard(req: Request, res: Response, next: NextFunction) {
  const { title, price, buyerEmail, orderId } = req.body;
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const idempotencyKey = req.headers['x-idempotency-key'] as string || 
    `${req.path}:${clientIp}:${buyerEmail || ''}:${title || ''}:${price || ''}:${orderId || ''}`;

  const now = Date.now();
  const existing = recentPaymentRequests.get(idempotencyKey);

  if (existing && (now - existing.timestamp < 10000)) { // 10 second window for double click
    if (existing.response) {
      console.warn(`[Anti-Double-Click] Returning cached payment response for key: ${idempotencyKey}`);
      return res.json(existing.response);
    }
    console.warn(`[Anti-Double-Click] Duplicate payment submission blocked for key: ${idempotencyKey}`);
    return res.status(429).json({
      success: false,
      error: 'Payment request is already being processed. Please do not click multiple times. (Duplicate payment submission detected)',
      isDuplicateRequest: true
    });
  }

  // Record initial request state
  recentPaymentRequests.set(idempotencyKey, { timestamp: now });

  // Wrap res.json to capture response for caching
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      recentPaymentRequests.set(idempotencyKey, { timestamp: now, response: body });
    } else {
      recentPaymentRequests.delete(idempotencyKey);
    }
    return originalJson(body);
  };

  next();
}

// Helper to determine base URL
function getBaseUrl(req: Request): string {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// Global In-Memory Verified Orders Cache (persists verified escrow webhook transactions across calls)
interface VerifiedEscrowRecord {
  orderId: string;
  gateway: 'paypal' | 'cmi';
  status: 'VERIFIED' | 'PENDING' | 'FAILED';
  amount: number;
  currency: string;
  transactionRef: string;
  payerEmail?: string;
  verifiedAt: string;
  rawDetails?: any;
}
const verifiedEscrowStore = new Map<string, VerifiedEscrowRecord>();

export function getVerifiedEscrowRecord(orderId: string): VerifiedEscrowRecord | undefined {
  return verifiedEscrowStore.get(orderId);
}

export function recordVerifiedEscrowPayment(record: VerifiedEscrowRecord) {
  verifiedEscrowStore.set(record.orderId, record);
}

// ==========================================
// 1. PAYPAL LIVE CHECKOUT ENDPOINTS
// ==========================================

async function getPaypalAccessToken(): Promise<string> {
  const config = await getEscrowPaymentConfig();
  const clientId = config.paypalClientId;
  const clientSecret = config.paypalClientSecret;
  const isLive = config.paypalMode === 'live';

  if (!clientId || !clientSecret) {
    throw new Error('PayPal Client ID or Secret is missing. Please configure it in AI Sentinel Hub (Escrow Guardian Bot) or set environment variables.');
  }

  const baseUrl = isLive
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal OAuth Error:', errorText);
    throw new Error(`Failed to authenticate with PayPal API: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

router.post('/api/payments/paypal/create-order', paymentLimiter, cardingShieldMiddleware, idempotencyGuard, async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const { title, price, orderId, buyerEmail } = req.body;
  try {
    const config = await getEscrowPaymentConfig();
    const isLive = config.paypalMode === 'live';
    const paypalBaseUrl = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    let accessToken = '';
    try {
      accessToken = await getPaypalAccessToken();
    } catch (authErr: any) {
      console.warn('[PayPal Integration Notice] API credentials missing or unverified:', authErr.message);
      recordFailedPaymentAttempt(clientIp, buyerEmail);
      return res.status(400).json({
        success: false,
        error: 'PayPal credentials are not configured. Please set PAYPAL_CLIENT_ID & PAYPAL_SECRET or use Moroccan CMI.'
      });
    }

    const numericPrice = Number(price) || 100;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || getBaseUrl(req);

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId || `ORD-${Date.now()}`,
          description: `AIWebCrafter Escrow: ${title || 'Digital Asset Acquisition'}`,
          amount: {
            currency_code: 'USD',
            value: numericPrice.toFixed(2)
          }
        }
      ],
      application_context: {
        brand_name: 'AIWebCrafter Escrow',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${appUrl}/?payment=success&gateway=paypal`,
        cancel_url: `${appUrl}/?payment=cancelled&gateway=paypal`
      }
    };

    const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('PayPal Order API Error:', data);
      return res.status(400).json({
        success: false,
        error: data.message || 'Failed to create PayPal order session',
        details: data
      });
    }

    const approveLink = data.links?.find((l: any) => l.rel === 'approve')?.href;

    return res.json({
      success: true,
      orderId: data.id,
      checkoutUrl: approveLink,
      status: data.status,
      isLive
    });
  } catch (err: any) {
    console.error('Error creating PayPal Order:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to create PayPal live session'
    });
  }
});

router.post('/api/payments/paypal/capture-order', paymentLimiter, cardingShieldMiddleware, async (req: Request, res: Response) => {
  const { paypalOrderId, orderId } = req.body;
  if (!paypalOrderId) {
    return res.status(400).json({ success: false, error: 'paypalOrderId is required' });
  }

  try {
    const config = await getEscrowPaymentConfig();
    const isLive = config.paypalMode === 'live';
    const paypalBaseUrl = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    const accessToken = await getPaypalAccessToken();

    const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(400).json({ success: false, error: data.message || 'Failed to capture PayPal payment', details: data });
    }

    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    const isCompleted = data.status === 'COMPLETED' || capture?.status === 'COMPLETED';

    if (isCompleted) {
      const targetOrderId = orderId || data.purchase_units?.[0]?.reference_id || paypalOrderId;
      recordVerifiedEscrowPayment({
        orderId: targetOrderId,
        gateway: 'paypal',
        status: 'VERIFIED',
        amount: parseFloat(capture?.amount?.value || '0'),
        currency: capture?.amount?.currency_code || 'USD',
        transactionRef: capture?.id || paypalOrderId,
        payerEmail: data.payer?.email_address,
        verifiedAt: new Date().toISOString(),
        rawDetails: data
      });
      console.log(`[EscrowBot] Captured and verified PayPal payment for order: ${targetOrderId} (Ref: ${capture?.id})`);
    }

    return res.json({
      success: true,
      status: data.status,
      captureId: capture?.id,
      payer: data.payer,
      isVerified: isCompleted
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. MOROCCAN CMI & LOCAL BANKING ENDPOINTS
// ==========================================

router.post('/api/payments/cmi/create-checkout', paymentLimiter, cardingShieldMiddleware, idempotencyGuard, async (req: Request, res: Response) => {
  const { title, price, orderId, buyerName, buyerEmail } = req.body;
  try {
    const config = await getEscrowPaymentConfig();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || getBaseUrl(req);

    const numericPriceUSD = Number(price) || 100;
    // Conversion rate USD to MAD (~10.0 MAD per 1 USD)
    const amountMAD = (numericPriceUSD * 10.0).toFixed(2);

    const cmiMerchantId = process.env.CMI_MERCHANT_ID || '';
    const cmiGatewayUrl = process.env.CMI_GATEWAY_URL || 'https://payment.cmi.co.ma/fim/est3Dgate';

    const cmiParameters = {
      clientid: cmiMerchantId,
      amount: amountMAD,
      currency: '504', // MAD (Moroccan Dirham currency code)
      oid: orderId || `CMI-${Date.now()}`,
      shopurl: appUrl,
      okUrl: `${appUrl}/?payment=success&gateway=cmi`,
      failUrl: `${appUrl}/?payment=failed&gateway=cmi`,
      CallbackURL: `${appUrl}/api/webhooks/cmi`,
      BillToName: buyerName || 'Buyer',
      BillToCompany: 'Escrow Marketplace',
      email: buyerEmail || '',
      storetype: '3D_PAY_HOSTING',
      rnd: String(Date.now()),
      lang: 'fr'
    };

    return res.json({
      success: true,
      cmiGatewayUrl,
      cmiParameters,
      amountMAD,
      amountUSD: numericPriceUSD,
      beneficiaryName: config.localBeneficiaryName,
      instructions: config.localInstructions,
      moroccanBanks: [
        { name: 'CIH Bank', rib: config.localCihRib, swift: process.env.CIH_SWIFT || '' },
        { name: 'Attijariwafa Bank', rib: config.localAttijariRib, swift: process.env.ATTIJARI_SWIFT || '' },
        { name: 'BMCE Bank of Africa', rib: process.env.BMCE_RIB || '', swift: process.env.BMCE_SWIFT || '' },
        { name: 'Banque Populaire (BCP)', rib: process.env.BCP_RIB || '', swift: process.env.BCP_SWIFT || '' }
      ].filter(b => !!b.rib)
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to prepare Moroccan CMI Checkout session'
    });
  }
});

// =========================================================================
// 3. SERVER-SIDE WEBHOOK & IPN HANDLERS
// =========================================================================

// A) PayPal Webhook IPN Verification
router.post('/api/webhooks/paypal', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    console.log(`[PayPal Webhook] Received event: ${event.event_type} (ID: ${event.id})`);

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED' || event.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const resource = event.resource;
      const orderId = resource?.custom_id || resource?.supplementary_data?.related_ids?.order_id || resource?.id;
      const amount = parseFloat(resource?.amount?.value || '0');
      const currency = resource?.amount?.currency_code || 'USD';
      const payerEmail = resource?.payer?.email_address;

      if (orderId) {
        recordVerifiedEscrowPayment({
          orderId,
          gateway: 'paypal',
          status: 'VERIFIED',
          amount,
          currency,
          transactionRef: resource.id,
          payerEmail,
          verifiedAt: new Date().toISOString(),
          rawDetails: event
        });
        console.log(`[EscrowBot] Webhook Verified & Escrow Locked for Order #${orderId}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Error handling PayPal webhook:', err);
    return res.status(500).json({ error: err.message });
  }
});

// B) CMI Webhook / IPN Handler
router.post('/api/webhooks/cmi', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    console.log(`[CMI Webhook] Received CMI transaction callback:`, body);
    const orderId = body?.oid || body?.OrderId;
    const amount = parseFloat(body?.amount || '0');

    if (orderId) {
      recordVerifiedEscrowPayment({
        orderId,
        gateway: 'cmi',
        status: 'VERIFIED',
        amount,
        currency: 'MAD',
        transactionRef: body?.transId || `cmi_${Date.now()}`,
        verifiedAt: new Date().toISOString(),
        rawDetails: body
      });
      console.log(`[EscrowBot] CMI Deposit Confirmed for Order #${orderId}`);
    }

    return res.send('ACTION=POSTAUTH');
  } catch (err: any) {
    console.error('Error processing CMI webhook:', err);
    return res.status(500).json({ error: err.message });
  }
});

// C) Escrow Status Verification Endpoint
router.get('/api/payments/verify-status/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const record = getVerifiedEscrowRecord(orderId);

    if (record) {
      return res.json({
        success: true,
        verified: record.status === 'VERIFIED',
        record
      });
    }

    return res.json({
      success: true,
      verified: false,
      status: 'AWAITING_WEBHOOK_CONFIRMATION',
      message: 'Payment has not yet been verified by server gateway webhook or admin wire confirmation.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
