/**
 * Safe API Fetch Utility
 * Reads response body as text once to avoid "body stream already read" and parses safely
 * Prevents "Unexpected token 'A' / '<' ... is not valid JSON" crashes.
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const requestHeaders = new Headers(init?.headers);
    if (!requestHeaders.has('Cache-Control')) {
      requestHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    if (!requestHeaders.has('Pragma')) {
      requestHeaders.set('Pragma', 'no-cache');
    }

    let requestBody = init?.body;
    if (requestBody && typeof requestBody === 'object' && !(requestBody instanceof FormData) && !(requestBody instanceof URLSearchParams) && !(requestBody instanceof Blob) && !(requestBody instanceof ArrayBuffer)) {
      requestBody = JSON.stringify(requestBody);
      if (!requestHeaders.has('Content-Type')) {
        requestHeaders.set('Content-Type', 'application/json');
      }
    }

    const enhancedInit: RequestInit = {
      cache: 'no-store',
      ...init,
      body: requestBody,
      headers: requestHeaders
    };

    const res = await fetch(input, enhancedInit);
    const text = await res.text();

    if (!text || text.trim() === '') {
      return {
        ok: res.ok,
        status: res.status,
        data: undefined,
        error: res.ok ? undefined : `Server returned empty response (${res.status})`
      };
    }

    // Handle HTML/Plain text error responses gracefully
    if (text.trim().startsWith('<') || text.trim().startsWith('<!DOCTYPE')) {
      const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const preview = stripped.slice(0, 150);
      return {
        ok: false,
        status: res.status,
        error: `Server response (${res.status}): ${preview || 'Please check Vercel and Supabase environment variables'}`
      };
    }

    let parsedData: any = null;
    try {
      parsedData = JSON.parse(text);
    } catch {
      return {
        ok: false,
        status: res.status,
        error: text.length > 200 ? text.slice(0, 200) + '...' : text
      };
    }

    if (!res.ok || parsedData?.success === false) {
      return {
        ok: false,
        status: res.status,
        data: parsedData,
        error: parsedData?.error || parsedData?.message || `Request failed (${res.status})`
      };
    }

    return {
      ok: true,
      status: res.status,
      data: parsedData
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        ok: false,
        status: 0,
        error: 'Request aborted'
      };
    }
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network connection failed'
    };
  }
}
