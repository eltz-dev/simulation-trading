import type { IncomingMessage, ServerResponse } from 'http';
import { analyzeMarketWithAI, AnalyzeMarketInput } from '../../lib/traderAi';

interface VercelRequest extends IncomingMessage {
  body?: unknown;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
}

async function parseRequestBody(req: VercelRequest): Promise<AnalyzeMarketInput> {
  if (req.body && typeof req.body === 'object') {
    return req.body as AnalyzeMarketInput;
  }
  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as AnalyzeMarketInput;
  }

  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? (JSON.parse(raw) as AnalyzeMarketInput) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

  try {
    const body = await parseRequestBody(req);
    const decision = await analyzeMarketWithAI(body);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        decision,
        timestamp: Date.now(),
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Vercel Trader AI endpoint error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: message }));
  }
}
