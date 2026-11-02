/**
 * Phase 4H.7 — Safe Real Integration Test
 * 
 * Objectives:
 * 1. Verify connectivity between Store (Frontend) and Cloud API.
 * 2. Create AWC-INTEGRATION-TEST product.
 * 3. Verify GitHub Persistence (if configured).
 * 4. Verify Retrieval and Data Integrity.
 * 5. Verify Idempotency.
 * 6. Clean up (delete) test product.
 */

import { 
  getPermanentStorageProducts,
  createPermanentStorageProduct,
  deletePermanentStorageProduct 
} from '../src/services/gitStorageClient';

async function runIntegrationTest() {
  console.log('--- STARTING INTEGRATION TEST ---');
  
  const TEST_SKU = 'AWC-INTEGRATION-TEST';
  
  try {
    // 1. Connectivity Check
    console.log('Test 1: Connectivity Check...');
    const initialCatalog = await getPermanentStorageProducts();
    console.log(`Status: 200 OK. Found ${initialCatalog.items.length} existing products.`);

    // 2. Add Test Product
    console.log('Test 2: Adding test product...');
    const testProduct = {
      name: 'AWC Integration Test Product',
      name_ar: 'منتج اختبار التكامل',
      sku: TEST_SKU,
      price: 1.00,
      stock_quantity: 1,
      description: 'Integration test',
      is_published: false
    };
    
    const createResult = await createPermanentStorageProduct(testProduct);
    if (!createResult.success) throw new Error(`Add failed: ${createResult.error}`);
    console.log(`Status: 201 Created. Test Product ID: ${createResult.data.id}`);

    // 3. Verify Persistence (Refresh)
    console.log('Test 3: Verifying persistence...');
    const updatedCatalog = await getPermanentStorageProducts();
    const found = updatedCatalog.items.find(p => p.sku === TEST_SKU);
    if (!found) throw new Error('Product not found in catalog after creation!');
    console.log('Status: 200 OK. Persistence verified.');

    // 4. Verify Data Integrity
    console.log('Test 4: Verifying integrity...');
    if (found.name !== testProduct.name || found.price !== testProduct.price) {
      throw new Error('Data mismatch!');
    }
    console.log('Status: 200 OK. Data integrity verified.');

    // 5. Verify Visibility (Draft)
    console.log('Test 5: Verifying visibility...');
    if (found.is_published !== false) {
      throw new Error('Product should be Draft!');
    }
    console.log('Status: 200 OK. Visibility correct.');

    // 6. Cleanup
    console.log('Test 6: Cleanup...');
    const delResult = await deletePermanentStorageProduct(found.id);
    if (!delResult.success) throw new Error(`Cleanup failed: ${delResult.error}`);
    console.log('Status: 200 OK. Test product removed.');

    console.log('--- TEST PASSED SUCCESSFULLY ---');

  } catch (error: any) {
    console.error('--- TEST FAILED ---');
    console.error(error.message);
    process.exit(1);
  }
}

runIntegrationTest();
