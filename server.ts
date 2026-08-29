import express from 'express';
import path from 'path';
import app from './server/app.js';

const PORT = 3000;

// --- VITE / STATIC SERVING MIDDLEWARE ---
async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      (app as any).use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*all', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 AIWebCrafter Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    // Fallback static listen so server stays running
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚠️ AIWebCrafter Server running in fallback mode on http://0.0.0.0:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Uncaught startServer error:', err);
  });
}

export default app;
