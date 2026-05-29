// netlify/functions/api.ts

import 'dotenv/config';
import type { Handler } from '@netlify/functions';
import express, { type Request, Response, NextFunction } from 'express';
import { createServer, type IncomingMessage } from 'http';
import serverless from 'serverless-http';

import { registerRoutes } from '../../server/routes';
import { seedDatabase } from '../../server/seed';

// ---- Extra typing for rawBody (same pattern as server/index.ts) ----
declare module 'http' {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

const app = express();
const httpServer = createServer(app);

// ---------- Middleware: JSON + raw body capture ----------
app.use(
  express.json({
    verify: (req: IncomingMessage, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// ---------- Simple logger (copied from server/index.ts) ----------
export function log(message: string, source = 'netlify') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// ---------- Request logging middleware ----------
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;

  let capturedJsonResponse: Record<string, any> | undefined;
  const originalResJson = res.json.bind(res);

  (res as any).json = (bodyJson: any, ...args: any[]) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// ---------- One‑time init (routes + seed) ----------
let initialized = false;

async function initOnce() {
  if (initialized) return;
  await registerRoutes(httpServer, app);
  await seedDatabase();
  initialized = true;
  log('Netlify API initialized');
}

// ---------- Error handler (same style as server/index.ts) ----------
app.use(
  (
    err: Error & { status?: number; statusCode?: number },
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    console.error('Internal Server Error:', err);

    if (res.headersSent) {
      return next(err);
    }

    res.status(status).json({ message });
  },
);

// ---------- Health check ----------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'Conneclify API running on Netlify' });
});

// ---------- Wrap Express in Netlify handler ----------
const expressHandler = serverless(app);

export const handler: Handler = async (event, context) => {
  await initOnce();
  return expressHandler(event as any, context as any);
};
