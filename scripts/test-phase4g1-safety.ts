import dotenv from 'dotenv';
dotenv.config({ override: true });

import { gitStorage, GitStorageService, GitStorageError } from '../backend/services/gitStorageService';
import { getAdminEmail, getAdminMasterKey, getSigningSecret } from '../backend/services/authService';

async function runPhase4g1SafetyTests() {
  console.log('======================================================================');
  console.log('AIWebCrafter.com - Phase 4G.1 Pre-Deployment Safety Verification Suite');
  console.log('======================================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function assertTest(name: string, condition: boolean, detail: string) {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`✅ TEST ${totalCount} PASSED [${name}]`);
      console.log(`   └─ ${detail}`);
    } else {
      console.error(`❌ TEST ${totalCount} FAILED [${name}]`);
      console.error(`   └─ ${detail}`);
      process.exit(1);
    }
  }

  // Preserve original env vars to restore at end of test suite
  const origEnv = { ...process.env };

  // --------------------------------------------------------------------------
  // TEST 1: Missing AWC_ADMIN_KEY in Production
  // --------------------------------------------------------------------------
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.AWC_ADMIN_KEY;
    delete process.env.AWC_API_SECRET;

    let threw = false;
    try {
      getAdminMasterKey();
    } catch (e: any) {
      threw = e.message.includes('AWC_ADMIN_KEY');
    }
    assertTest(
      'Auth Security: Missing AWC_ADMIN_KEY in Production',
      threw,
      'getAdminMasterKey() strictly threw configuration error when AWC_ADMIN_KEY was missing in production mode.'
    );
  } finally {
    process.env = { ...origEnv };
  }

  // --------------------------------------------------------------------------
  // TEST 2: Missing AWC_ADMIN_EMAIL in Production
  // --------------------------------------------------------------------------
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.AWC_ADMIN_EMAIL;

    let threw = false;
    try {
      getAdminEmail();
    } catch (e: any) {
      threw = e.message.includes('AWC_ADMIN_EMAIL');
    }
    assertTest(
      'Auth Security: Missing AWC_ADMIN_EMAIL in Production',
      threw,
      'getAdminEmail() strictly threw configuration error when AWC_ADMIN_EMAIL was missing in production mode.'
    );
  } finally {
    process.env = { ...origEnv };
  }

  // --------------------------------------------------------------------------
  // TEST 3: Missing AWC_SIGNING_SECRET in Production
  // --------------------------------------------------------------------------
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.AWC_SIGNING_SECRET;

    let threw = false;
    try {
      getSigningSecret();
    } catch (e: any) {
      threw = e.message.includes('AWC_SIGNING_SECRET');
    }
    assertTest(
      'Auth Security: Missing AWC_SIGNING_SECRET in Production',
      threw,
      'getSigningSecret() strictly threw configuration error when AWC_SIGNING_SECRET was missing in production mode.'
    );
  } finally {
    process.env = { ...origEnv };
  }

  // --------------------------------------------------------------------------
  // TEST 4: Production Storage: Missing GITHUB_TOKEN Error
  // --------------------------------------------------------------------------
  try {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    delete process.env.GITHUB_TOKEN;

    const testService = new GitStorageService({ token: '' });
    let threw = false;

    try {
      await testService.getProducts(true);
    } catch (e: any) {
      threw = e instanceof GitStorageError && e.message.includes('GITHUB_TOKEN');
    }

    assertTest(
      'Storage Security: Missing GITHUB_TOKEN in Production',
      threw,
      'gitStorage.getProducts() strictly rejected request without silent local fallback when GITHUB_TOKEN was missing in production.'
    );
  } finally {
    process.env = { ...origEnv };
  }

  // --------------------------------------------------------------------------
  // TEST 5: Production Storage: GitHub HTTP 403 / Write Failure Rejection
  // --------------------------------------------------------------------------
  try {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    process.env.GITHUB_TOKEN = 'github_pat_mock_invalid_403_token';

    const mockFetch403: typeof fetch = async () => {
      return new Response(JSON.stringify({ message: 'Resource not accessible by personal access token' }), {
        status: 403,
        statusText: 'Forbidden'
      });
    };

    const testService = new GitStorageService({
      token: 'github_pat_mock_invalid_403_token',
      fetchFn: mockFetch403
    });

    let threw = false;
    try {
      await testService.saveProducts([], 'test commit');
    } catch (e: any) {
      threw = e instanceof GitStorageError && (e.status === 403 || e.message.includes('403'));
    }

    assertTest(
      'Storage Security: No False Success on GitHub Write 403',
      threw,
      'saveProducts() strictly threw GitStorageError on GitHub 403 and never reported false success or silent local fallback in production.'
    );
  } finally {
    process.env = { ...origEnv };
  }

  // --------------------------------------------------------------------------
  // TEST 6: Production Storage: GitHub HTTP 200 Write Success
  // --------------------------------------------------------------------------
  try {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    process.env.GITHUB_TOKEN = 'github_pat_valid_mock_token';

    const mockFetchSuccess: typeof fetch = async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes('/contents/data/products.json')) {
        if (init?.method === 'PUT') {
          return new Response(JSON.stringify({
            content: { sha: 'mock_confirmed_github_sha_999' },
            commit: { sha: 'mock_commit_sha_123' }
          }), { status: 200 });
        }
        return new Response(JSON.stringify({
          content: Buffer.from(JSON.stringify([{ id: 1, name: 'Sample' }])).toString('base64'),
          sha: 'mock_existing_sha_111'
        }), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    };

    const testService = new GitStorageService({
      token: 'github_pat_valid_mock_token',
      localDataDir: '/tmp/test_phase4g1_mock_data',
      fetchFn: mockFetchSuccess
    });

    const res = await testService.saveProducts([{ id: 1, name: 'Sample' } as any], 'test commit', 'mock_existing_sha_111');
    assertTest(
      'Storage Verification: GitHub Write Confirmed Success',
      res.success && res.sha === 'mock_confirmed_github_sha_999',
      `saveProducts() successfully verified GitHub commit confirmation (SHA: ${res.sha}).`
    );
  } finally {
    process.env = { ...origEnv };
  }

  // --------------------------------------------------------------------------
  // TEST 7: Catalog Integrity & Category Reader Verification
  // --------------------------------------------------------------------------
  try {
    const cats = await gitStorage.getCategories();
    assertTest(
      'Data Integrity: Categories Persistent Reader',
      Array.isArray(cats) && cats.length === 6 && cats[0].name === 'Moroccan Artisanal Crafts',
      `getCategories() read ${cats.length} categories from persistent storage.`
    );
  } finally {
    process.env = { ...origEnv };
  }

  console.log('\n======================================================================');
  console.log(`PHASE 4G.1 SAFETY SUITE SUMMARY: ${passedCount}/${totalCount} PASSED`);
  console.log('======================================================================');
}

runPhase4g1SafetyTests().catch((err) => {
  console.error('Fatal Safety Test Error:', err);
  process.exit(1);
});
