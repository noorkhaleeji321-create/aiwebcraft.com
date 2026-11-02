import http from 'http';

async function runTests() {
  process.env.NODE_ENV = 'test';
  delete process.env.VERCEL;
  process.env.AWC_ADMIN_KEY = 'aiwebcrafter2026';
  process.env.AWC_ADMIN_EMAIL = 'admin@aiwebcrafter.com';

  const { createApp } = await import('../app-server.js');
  console.log('--- STARTING LIVE HTTP INTEGRATION TESTS ---');
  const app = createApp();
  const server = http.createServer(app);
  
  await new Promise<void>((resolve) => server.listen(3001, '127.0.0.1', resolve));
  console.log('Test Express server listening on http://127.0.0.1:3001');

  const baseUrl = 'http://127.0.0.1:3001';

  try {
    // 1. Test GET /api/v1/ping
    console.log('\n[TEST 1] GET /api/v1/ping');
    const pingRes = await fetch(`${baseUrl}/api/v1/ping`);
    const pingJson = await pingRes.json() as any;
    console.log('Status:', pingRes.status);
    console.log('Response:', pingJson);
    if (pingRes.status !== 200 || !pingJson.success) throw new Error('GET /api/v1/ping failed');

    // 2. Test GET /api/v1/products
    console.log('\n[TEST 2] GET /api/v1/products');
    const productsRes = await fetch(`${baseUrl}/api/v1/products`);
    const productsJson = await productsRes.json() as any;
    console.log('Status:', productsRes.status);
    console.log('Products count:', Array.isArray(productsJson.data) ? productsJson.data.length : 'N/A');
    if (productsRes.status !== 200 || !productsJson.success) throw new Error('GET /api/v1/products failed');

    // 3. Test POST /api/backend/auth/login
    console.log('\n[TEST 3] Authentication POST /api/backend/auth/login');
    const loginRes = await fetch(`${baseUrl}/api/backend/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aiwebcrafter.com', password: 'aiwebcrafter2026' })
    });
    const loginJson = await loginRes.json() as any;
    console.log('Status:', loginRes.status);
    console.log('Login success:', loginJson.success, 'Token received:', Boolean(loginJson.token));
    if (loginRes.status !== 200 || !loginJson.token) throw new Error('Auth login failed');
    const token = loginJson.token;

    // 4. Test Product Creation
    console.log('\n[TEST 4] Product Creation POST /api/backend/storage/products');
    const testProduct = {
      name: 'Integration Test Product ' + Date.now(),
      name_ar: 'منتج تجربة التكامل',
      slug: 'integration-test-' + Date.now(),
      description: 'Automated test product for Vercel deployment verification.',
      price: 199.99,
      promo_price: 149.99,
      category_id: 1,
      category_name: 'Natural Health',
      sku: 'TEST-SKU-' + Date.now(),
      stock_quantity: 50,
      is_published: true,
      is_featured: false
    };

    const createRes = await fetch(`${baseUrl}/api/backend/storage/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testProduct)
    });
    const createJson = await createRes.json() as any;
    console.log('Status:', createRes.status);
    console.log('Created product ID:', createJson.data?.id, 'Name:', createJson.data?.name);
    if (!createJson.success || !createJson.data?.id) throw new Error('Product creation failed');

    // 5. Test Product Persistence & Retrieval
    console.log('\n[TEST 5] Product Retrieval GET /api/backend/storage/products');
    const getRes = await fetch(`${baseUrl}/api/backend/storage/products`);
    const getJson = await getRes.json() as any;
    console.log('Status:', getRes.status);
    const createdItem = getJson.data?.items?.find((p: any) => p.id === createJson.data.id);
    console.log('Found created product in list:', Boolean(createdItem));
    if (!createdItem) throw new Error('Product persistence verification failed');

    console.log('\n ALL LIVE HTTP INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
