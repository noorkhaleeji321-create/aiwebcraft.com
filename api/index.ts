import app from '../server/app.js';

export default async function handler(req: any, res: any) {
  // Ensure JSON response header by default
  try {
    if (res.setHeader && !res.headersSent) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key');
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    // Normalize URL for Express routing across different Vercel routing modes
    if (req.url) {
      // If Vercel rewrote /api/xyz to /api or /api/index with query parameter
      const urlObj = new URL(req.url, 'http://localhost');
      let pathname = urlObj.pathname;

      if (urlObj.searchParams.has('match')) {
        const match = urlObj.searchParams.get('match');
        pathname = match ? `/api/${match}` : pathname;
        urlObj.searchParams.delete('match');
      }

      if (!pathname.startsWith('/api')) {
        pathname = `/api${pathname.startsWith('/') ? '' : '/'}${pathname}`;
      }

      const queryString = urlObj.searchParams.toString();
      req.url = pathname + (queryString ? `?${queryString}` : '');
    }

    // Delegate to Express app
    return (app as any)(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Function Crash:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: err?.message || 'Server error occurred inside Vercel Serverless Handler.'
      }));
    }
  }
}
