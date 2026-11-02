/**
 * Permanent Storage Bridge Client for AIWebCrafter Dashboard
 * Communicates with the secure backend server (/api/backend/storage/*)
 * Zero secret tokens exposed in browser or React code!
 */

export interface PermanentStorageStatus {
  mode: 'github' | 'local_git';
  owner: string;
  repo: string;
  branch: string;
  products_count: number;
  orders_count: number;
  has_token: boolean;
  storage_path: string;
  cache_active: boolean;
  last_auth_error: string | null;
}

const ADMIN_TOKEN_KEY = 'aiwebcrafter_admin_token';

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setAdminToken(token: string, persist = true): void {
  try {
    if (persist) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    }
  } catch {}
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {}
}

function getAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-awc-session-token'] = token;
  }
  return headers;
}

async function safeParseJsonResponse(res: Response): Promise<{ ok: boolean; status: number; data?: any; text?: string }> {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text().catch(() => '');
  if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      const data = JSON.parse(text);
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: res.status, text };
    }
  }
  return { ok: false, status: res.status, text };
}

// ----------------------------------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------------------------------

export async function adminLogin(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const res = await fetch('/api/backend/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: normalizedEmail, password })
    });

    const parsed = await safeParseJsonResponse(res);

    if (parsed.ok && parsed.data?.success) {
      if (parsed.data.token) {
        setAdminToken(parsed.data.token);
      }
      return { success: true, token: parsed.data.token };
    }

    if (parsed.data?.error) {
      return { success: false, error: parsed.data.error };
    }

    if (!parsed.ok) {
      return {
        success: false,
        error: parsed.text
          ? `Server Error (${parsed.status}): ${parsed.text.slice(0, 100).replace(/<[^>]+>/g, '')}`
          : `Authentication failed: HTTP ${parsed.status}`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error connecting to authentication server.'
    };
  }

  return { success: false, error: 'Authentication failed: Invalid administrator credentials.' };
}

export async function adminLogout(): Promise<{ success: boolean }> {
  try {
    await fetch('/api/backend/auth/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });
  } catch {}
  clearAdminToken();
  return { success: true };
}

// ----------------------------------------------------------------------------
// TELEMETRY & STATUS
// ----------------------------------------------------------------------------

export async function getPermanentStorageStatus(): Promise<PermanentStorageStatus | null> {
  try {
    const res = await fetch('/api/backend/storage/status');
    const parsed = await safeParseJsonResponse(res);
    if (!parsed.ok || !parsed.data) return null;
    return parsed.data.data || null;
  } catch (e) {
    return null;
  }
}

// ----------------------------------------------------------------------------
// PRODUCTS MANAGEMENT
// ----------------------------------------------------------------------------

export async function getPermanentStorageProducts(): Promise<{
  items: any[];
  total: number;
  git_sha: string;
  from_cache: boolean;
}> {
  const res = await fetch('/api/backend/storage/products');
  const parsed = await safeParseJsonResponse(res);
  if (!parsed.ok || !parsed.data) {
    throw new Error(`Failed to fetch products from backend: HTTP ${parsed.status} ${parsed.text || ''}`);
  }
  return {
    items: parsed.data.data?.items || [],
    total: parsed.data.data?.total || 0,
    git_sha: parsed.data.data?.git_sha || '',
    from_cache: Boolean(parsed.data.data?.from_cache)
  };
}

export async function createPermanentStorageProduct(productData: any): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const res = await fetch('/api/backend/storage/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });

    const parsed = await safeParseJsonResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      if (parsed.status === 401) {
        return { success: false, error: 'Permission Denied: Administrator authentication required.' };
      }
      return { success: false, error: parsed.data?.error || `Creation failed: HTTP ${parsed.status}` };
    }

    return { success: true, data: parsed.data.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error creating product' };
  }
}

export async function updatePermanentStorageProduct(id: number, updates: any): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/backend/storage/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    const parsed = await safeParseJsonResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      if (parsed.status === 401) {
        return { success: false, error: 'Permission Denied: Administrator authentication required.' };
      }
      return { success: false, error: parsed.data?.error || `Update failed: HTTP ${parsed.status}` };
    }

    return { success: true, data: parsed.data.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error updating product' };
  }
}

export async function deletePermanentStorageProduct(id: number): Promise<{
  success: boolean;
  deleted_id?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/backend/storage/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const parsed = await safeParseJsonResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      if (parsed.status === 401) {
        return { success: false, error: 'Permission Denied: Administrator authentication required.' };
      }
      return { success: false, error: parsed.data?.error || `Deletion failed: HTTP ${parsed.status}` };
    }

    return { success: true, deleted_id: parsed.data.deleted_id || id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error deleting product' };
  }
}

// ----------------------------------------------------------------------------
// ORDERS MANAGEMENT
// ----------------------------------------------------------------------------

export async function getPermanentStorageOrders(): Promise<any[]> {
  const res = await fetch('/api/backend/storage/orders', {
    headers: getAuthHeaders()
  });

  const parsed = await safeParseJsonResponse(res);
  if (!parsed.ok || !parsed.data) {
    if (parsed.status === 401) {
      throw new Error('Permission Denied: Administrator authentication required to view orders.');
    }
    throw new Error(`Failed to fetch orders from backend: HTTP ${parsed.status} ${parsed.text || ''}`);
  }

  return parsed.data.data || [];
}

export async function updatePermanentStorageOrderStatus(
  orderId: number,
  status: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/backend/storage/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });

    const parsed = await safeParseJsonResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      if (parsed.status === 401) {
        return { success: false, error: 'Permission Denied: Administrator authentication required.' };
      }
      return { success: false, error: parsed.data?.error || `Failed to update status: HTTP ${parsed.status}` };
    }

    return { success: true, data: parsed.data.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error updating order status' };
  }
}

export async function deletePermanentStorageOrder(id: number): Promise<{
  success: boolean;
  deleted_id?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/backend/storage/orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const parsed = await safeParseJsonResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      if (parsed.status === 401) {
        return { success: false, error: 'Permission Denied: Administrator authentication required.' };
      }
      return { success: false, error: parsed.data?.error || `Deletion failed: HTTP ${parsed.status}` };
    }

    return { success: true, deleted_id: parsed.data.deleted_id || id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error deleting order' };
  }
}

// ----------------------------------------------------------------------------
// BACKUP & RESTORE
// ----------------------------------------------------------------------------

export async function createPermanentBackupSnapshot(label = 'manual'): Promise<{
  success: boolean;
  filename?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/backend/storage/backup', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ label })
    });
    const parsed = await safeParseJsonResponse(res);
    return parsed.data || { success: false, error: `HTTP ${parsed.status}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function restorePermanentBackupSnapshot(filename: string): Promise<{
  success: boolean;
  restoredProductsCount?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/backend/storage/restore', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ filename })
    });
    const parsed = await safeParseJsonResponse(res);
    return parsed.data || { success: false, error: `HTTP ${parsed.status}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function clearPermanentStorageProducts(): Promise<{
  success: boolean;
  cleared_count?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/backend/storage/products/clear-sample/all', {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const parsed = await safeParseJsonResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      return { success: false, error: parsed.data?.error || `Failed to clear products: HTTP ${parsed.status}` };
    }
    return { success: true, cleared_count: parsed.data.cleared_count };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function clearPermanentStorageOrders(): Promise<{
  success: boolean;
  cleared_count?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/backend/storage/orders/clear-sample/all', {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const parsed = await safeParseJsonResponse(res);
    if (!parsed.ok || !parsed.data?.success) {
      return { success: false, error: parsed.data?.error || `Failed to clear orders: HTTP ${parsed.status}` };
    }
    return { success: true, cleared_count: parsed.data.cleared_count };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
