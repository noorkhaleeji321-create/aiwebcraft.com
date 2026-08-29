/**
 * Universal Safe JSON Fetch Helper
 * Prevents "Unexpected token '<' / 'A' ... is not valid JSON" crashes.
 */
export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const headers = new Headers(options?.headers);
    let body = options?.body;
    if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
      body = JSON.stringify(body);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }
    const res = await fetch(url, {
      ...options,
      body,
      headers
    });
    const text = await res.text();

    if (!text || text.trim() === '') {
      return {
        ok: res.ok,
        status: res.status,
        data: null,
        error: res.ok ? null : `Empty response from server (Status: ${res.status})`
      };
    }

    // Handle HTML/Plain text error responses gracefully
    if (text.trim().startsWith('<') || text.trim().startsWith('<!DOCTYPE')) {
      const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const preview = stripped.slice(0, 120);
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Server error (${res.status}): ${preview || 'Please check server environment and configuration'}`
      };
    }

    try {
      const parsed = JSON.parse(text);
      const isSuccess = res.ok && parsed?.success !== false;
      return {
        ok: isSuccess,
        status: res.status,
        data: parsed,
        error: parsed?.error || (res.ok ? null : `Request failed with status code ${res.status}`)
      };
    } catch {
      // Return clean message instead of throwing JSON syntax error
      return {
        ok: false,
        status: res.status,
        data: null,
        error: text.length > 200 ? text.slice(0, 200) + '...' : text
      };
    }
  } catch (networkErr: any) {
    if (networkErr?.name === 'AbortError') {
      return { ok: false, status: 0, data: null, error: 'Request aborted' };
    }
    return {
      ok: false,
      status: 0,
      data: null,
      error: networkErr?.message || 'Unable to connect to server.'
    };
  }
}
