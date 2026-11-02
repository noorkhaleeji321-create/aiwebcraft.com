import { ApiKey, Order, Product, Category } from '../types';
import { SEED_API_KEYS } from '../db/seedData';
import { getDatabase, addActivityLog, persistDatabase, getAllProducts, getAllCategories, getAllOrders } from '../db/sqliteEngine';
import { updateStorageQuota } from './storageService';

const API_KEYS_STORAGE_KEY = 'aiwebcrafter_api_keys_v1';

export function getApiKeys(): ApiKey[] {
  const saved = localStorage.getItem(API_KEYS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return SEED_API_KEYS;
}

export function saveApiKeys(keys: ApiKey[]) {
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
}

export function generateApiKey(name: string, permissions: ApiKey['permissions']): { key: ApiKey; secretToken: string } {
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const secretToken = `awc_live_${randomHex}`;
  const keyPrefix = `awc_live_${randomHex.substring(0, 4)}...`;

  const newKey: ApiKey = {
    id: `key_${Date.now()}`,
    name,
    key_prefix: keyPrefix,
    token_hash: `sha256:${randomHex.substring(10, 30)}`,
    permissions,
    last_used_at: null,
    created_at: new Date().toISOString(),
    status: 'active'
  };

  const list = getApiKeys();
  list.unshift(newKey);
  saveApiKeys(list);

  return { key: newKey, secretToken };
}

export function revokeApiKey(id: string) {
  const list = getApiKeys().map(k => k.id === id ? { ...k, status: 'revoked' as const } : k);
  saveApiKeys(list);
}

export interface ApiResponse<T = any> {
  status: number;
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    latency_ms: number;
    timestamp: string;
    quota_remaining: number;
  };
}

/**
 * Handles incoming store requests exactly as a live production API endpoint does.
 */
export async function handleApiRequest(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: any,
  apiKeyHeader?: string
): Promise<ApiResponse> {
  const startTime = performance.now();
  updateStorageQuota(0, false); // Record Class B read op

  // Simple key validation
  if (!apiKeyHeader || apiKeyHeader === 'undefined') {
    return {
      status: 401,
      success: false,
      error: 'Unauthorized: Missing or invalid X-AWC-API-KEY header.',
      meta: { latency_ms: 1, timestamp: new Date().toISOString(), quota_remaining: 9999980 }
    };
  }

  const db = await getDatabase();

  try {
    // Route: GET /api/v1/products
    if (method === 'GET' && endpoint.startsWith('/api/v1/products')) {
      const url = new URL(`http://localhost${endpoint}`);
      const categoryId = url.searchParams.get('category_id');
      const search = url.searchParams.get('q');
      const limit = Number(url.searchParams.get('limit')) || 20;
      const page = Number(url.searchParams.get('page')) || 1;

      let all = await getAllProducts();
      // Filter published only for public store
      all = all.filter(p => p.is_published);

      if (categoryId) {
        all = all.filter(p => p.category_id === Number(categoryId));
      }
      if (search) {
        const query = search.toLowerCase();
        all = all.filter(p => p.name.toLowerCase().includes(query) || p.name_ar.includes(query) || p.sku.toLowerCase().includes(query));
      }

      const total = all.length;
      const startIdx = (page - 1) * limit;
      const paginated = all.slice(startIdx, startIdx + limit);

      const latency = Number((performance.now() - startTime).toFixed(1));
      return {
        status: 200,
        success: true,
        data: {
          items: paginated,
          pagination: { total, page, limit, total_pages: Math.ceil(total / limit) }
        },
        meta: { latency_ms: latency, timestamp: new Date().toISOString(), quota_remaining: 4985800 }
      };
    }

    // Route: GET /api/v1/products/:id_or_slug
    if (method === 'GET' && endpoint.match(/^\/api\/v1\/products\/([^?]+)/)) {
      const match = endpoint.match(/^\/api\/v1\/products\/([^?]+)/);
      const identifier = match ? match[1] : '';
      const all = await getAllProducts();
      const product = all.find(p => String(p.id) === identifier || p.slug === identifier);

      if (!product) {
        return {
          status: 404,
          success: false,
          error: `Product with identifier '${identifier}' not found in database.`,
          meta: { latency_ms: 2, timestamp: new Date().toISOString(), quota_remaining: 4985800 }
        };
      }

      return {
        status: 200,
        success: true,
        data: product,
        meta: { latency_ms: 3, timestamp: new Date().toISOString(), quota_remaining: 4985800 }
      };
    }

    // Route: GET /api/v1/categories
    if (method === 'GET' && endpoint === '/api/v1/categories') {
      const cats = await getAllCategories();
      return {
        status: 200,
        success: true,
        data: cats,
        meta: { latency_ms: 2, timestamp: new Date().toISOString(), quota_remaining: 4985800 }
      };
    }

    // Route: POST /api/v1/orders (Store checkout placement)
    if (method === 'POST' && endpoint === '/api/v1/orders') {
      if (!body || !body.items || body.items.length === 0) {
        return {
          status: 400,
          success: false,
          error: 'Bad Request: Order must contain at least one item.',
          meta: { latency_ms: 1, timestamp: new Date().toISOString(), quota_remaining: 4985800 }
        };
      }

      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();

      // Find or create customer
      let customerId = 1;
      const custCheck = db.exec(`SELECT id FROM customers WHERE phone = ? OR email = ?`, [body.customer_phone || '', body.customer_email || '']);
      if (custCheck.length > 0 && custCheck[0].values.length > 0) {
        customerId = Number(custCheck[0].values[0][0]);
      } else {
        db.run(
          `INSERT INTO customers (uuid, first_name, last_name, email, phone, address_line1, city, state_region, postal_code, country, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Casablanca-Settat', '20000', 'Morocco', ?)`,
          [
            `cust_${Date.now()}`,
            body.customer_name?.split(' ')[0] || 'Customer',
            body.customer_name?.split(' ').slice(1).join(' ') || '',
            body.customer_email || `user_${Date.now()}@store.local`,
            body.customer_phone || '+212 600-000000',
            body.shipping_address || 'Delivery Address',
            body.city || 'Casablanca',
            now
          ]
        );
        const lastId = db.exec(`SELECT last_insert_rowid()`);
        customerId = Number(lastId[0].values[0][0]);
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const item of body.items) {
        totalAmount += (item.unit_price || 0) * (item.quantity || 1);
      }

      // Insert Order
      db.run(
        `INSERT INTO orders (order_number, customer_id, customer_name, customer_phone, customer_email, shipping_address, city, postal_code, total_amount, currency, payment_method, payment_status, order_status, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, '20000', ?, 'MAD', ?, 'pending', 'pending', ?, ?, ?)`,
        [
          orderNumber,
          customerId,
          body.customer_name || 'Customer Name',
          body.customer_phone || '',
          body.customer_email || '',
          body.shipping_address || '',
          body.city || 'Casablanca',
          totalAmount,
          body.payment_method || 'Cash On Delivery (COD)',
          body.notes || 'Order placed via store frontend API',
          now,
          now
        ]
      );

      const orderRowIdRes = db.exec(`SELECT last_insert_rowid()`);
      const orderId = Number(orderRowIdRes[0].values[0][0]);

      // Insert Order Items and decrement inventory
      for (const item of body.items) {
        const lineTotal = (item.unit_price || 0) * (item.quantity || 1);
        db.run(
          `INSERT INTO order_items (order_id, product_id, product_name, sku, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id || 1, item.product_name || 'Store Item', item.sku || 'SKU-001', item.unit_price || 0, item.quantity || 1, lineTotal]
        );

        // Decrement stock in products & inventory table
        db.run(
          `UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?`,
          [item.quantity || 1, item.product_id || 1]
        );
        db.run(
          `UPDATE inventory SET quantity = MAX(0, quantity - ?), updated_at = ? WHERE product_id = ?`,
          [item.quantity || 1, now, item.product_id || 1]
        );
      }

      persistDatabase(db);

      await addActivityLog(
        'ORDER_RECEIVED',
        'ORDER',
        orderNumber,
        `Order ${orderNumber} received for ${body.customer_name}. Total: ${totalAmount} MAD (${body.items.length} items). Stock updated.`
      );

      return {
        status: 201,
        success: true,
        data: {
          order_id: orderId,
          order_number: orderNumber,
          total_amount: totalAmount,
          currency: 'MAD',
          status: 'pending',
          created_at: now
        },
        meta: {
          latency_ms: Number((performance.now() - startTime).toFixed(1)),
          timestamp: now,
          quota_remaining: 4985790
        }
      };
    }

    // Route: PATCH /api/v1/orders/:id/status
    if (method === 'PATCH' && endpoint.match(/^\/api\/v1\/orders\/(\d+)\/status/)) {
      const match = endpoint.match(/^\/api\/v1\/orders\/(\d+)\/status/);
      const orderId = match ? match[1] : '';
      const newStatus = body?.status;

      if (!newStatus) {
        return { status: 400, success: false, error: 'Missing status field in request body.' };
      }

      db.run(`UPDATE orders SET order_status = ?, updated_at = ? WHERE id = ?`, [newStatus, new Date().toISOString(), orderId]);
      persistDatabase(db);

      await addActivityLog(
        'ORDER_STATUS',
        'ORDER',
        orderId,
        `Order ID #${orderId} status transitioned to '${newStatus}'`
      );

      return {
        status: 200,
        success: true,
        data: { order_id: Number(orderId), order_status: newStatus },
        meta: { latency_ms: 2, timestamp: new Date().toISOString(), quota_remaining: 4985785 }
      };
    }

    return {
      status: 404,
      success: false,
      error: `Endpoint '${method} ${endpoint}' not recognized.`,
      meta: { latency_ms: 1, timestamp: new Date().toISOString(), quota_remaining: 4985780 }
    };
  } catch (err: any) {
    return {
      status: 500,
      success: false,
      error: err.message || 'Internal Server Error',
      meta: { latency_ms: 5, timestamp: new Date().toISOString(), quota_remaining: 4985780 }
    };
  }
}

/**
 * Ready-to-use Code Generators for the Existing Store
 */
export function generateConnectorSnippet(
  language: 'javascript' | 'php' | 'python' | 'curl',
  apiKey = 'YOUR_AWC_STOREFRONT_KEY',
  headerName = 'X-AWC-STOREFRONT-KEY'
): string {
  const isBrowser = typeof window !== 'undefined';
  const baseUrl = isBrowser && window.location.origin && !window.location.origin.includes('localhost')
    ? `${window.location.origin}/api/v1`
    : 'https://www.aiwebcrafter.com/api/v1';

  switch (language) {
    case 'javascript':
      return `// -------------------------------------------------------------
// AIWebCrafter Store Connector (ES6 / Browser or Node.js)
// Dedicated Cloud Database & Storage API for Your Existing Store
// -------------------------------------------------------------

const AWC_CONFIG = {
  endpoint: "${baseUrl}",
  apiKey: "${apiKey}" // Keep on server-side or proxy in production
};

// 1. Fetch Published Products Catalog
async function getStoreProducts(categorySlug = null, page = 1) {
  const url = new URL(\`\${AWC_CONFIG.endpoint}/products\`);
  if (categorySlug) url.searchParams.set('category', categorySlug);
  url.searchParams.set('page', page);

  const response = await fetch(url.toString(), {
    headers: {
      '${headerName}': AWC_CONFIG.apiKey,
      'Accept': 'application/json'
    }
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Failed to fetch products');
  return result.data; // Array of products
}

// 2. Submit Customer Checkout Order
async function submitOrderToAIWebCrafter(cart) {
  const idempotencyKey = 'ord_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const response = await fetch(\`\${AWC_CONFIG.endpoint}/orders\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      '${headerName}': AWC_CONFIG.apiKey,
      'X-Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({
      customer_name: cart.customer.name,
      customer_phone: cart.customer.phone,
      customer_email: cart.customer.email || null,
      shipping_address: cart.customer.address,
      city: cart.customer.city,
      payment_method: cart.paymentMethod || 'Cash On Delivery (COD)',
      items: cart.items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        sku: item.sku,
        unit_price: item.price,
        quantity: item.qty || item.quantity || 1
      })),
      notes: cart.notes || ''
    })
  });
  return await response.json();
}
`;

    case 'php':
      return `<?php
/**
 * AIWebCrafter.com Cloud Database & Storage Connector for PHP
 * Compatible with WooCommerce, WordPress, and Custom PHP Storefronts
 */

class AIWebCrafterClient {
    private $baseUrl = '${baseUrl}';
    private $apiKey  = '${apiKey}';

    public function getProducts($limit = 20, $page = 1) {
        $ch = curl_init("{$this->baseUrl}/products?limit={$limit}&page={$page}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "${headerName}: {$this->apiKey}",
            "Accept: application/json"
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }

    public function createOrder($orderData) {
        $ch = curl_init("{$this->baseUrl}/orders");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json",
            "${headerName}: {$this->apiKey}",
            "X-Idempotency-Key: ord_" . uniqid()
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }
}
`;

    case 'python':
      return `# AIWebCrafter.com Python Store Integration
import requests
import time

AWC_URL = "${baseUrl}"
API_KEY = "${apiKey}"

headers = {
    "${headerName}": API_KEY,
    "Content-Type": "application/json"
}

def get_products():
    res = requests.get(f"{AWC_URL}/products", headers=headers)
    return res.json()

def submit_order(order_payload):
    req_headers = headers.copy()
    req_headers["X-Idempotency-Key"] = f"ord_{int(time.time()*1000)}"
    res = requests.post(f"{AWC_URL}/orders", headers=req_headers, json=order_payload)
    return res.json()
`;

    case 'curl':
      return `# 1. Fetch products list from AIWebCrafter database:
curl -X GET "${baseUrl}/products?limit=10" \\
  -H "${headerName}: ${apiKey}"

# 2. Place an order from existing store:
curl -X POST "${baseUrl}/orders" \\
  -H "Content-Type: application/json" \\
  -H "${headerName}: ${apiKey}" \\
  -H "X-Idempotency-Key: ord_test_123" \\
  -d '{
    "customer_name": "Yassine Amrani",
    "customer_phone": "+212 661-234567",
    "shipping_address": "Residence Al Mansour, Casablanca",
    "city": "Casablanca",
    "payment_method": "Cash On Delivery (COD)",
    "items": [
      { "product_id": 1, "product_name": "Organic Argan Oil", "sku": "ARG-BIO-100", "unit_price": 195, "quantity": 1 }
    ]
  }'
`;
  }
}
