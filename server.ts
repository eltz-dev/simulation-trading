import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { analyzeMarketWithAI } from './lib/traderAi';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API Route for Trader AI Market Strategy & Signal Decision
app.post('/api/trader-ai/analyze', async (req, res) => {
  try {
    const aiDecision = await analyzeMarketWithAI(req.body || {});
    return res.json({
      success: true,
      decision: aiDecision,
      timestamp: Date.now(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Trader AI endpoint error:', error);
    return res.status(500).json({ success: false, error: message });
  }
});

// Setup Vite in Dev or Static files in Production
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Trading Simulation Training server listening on http://0.0.0.0:${port}`);
  });
}

setupServer();
