import { serve } from '@hono/node-server';
import { handle } from '@hono/node-server/vercel';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { rateRouter } from './routes/rate.js';
import { env } from './schemas/env.js';

export const app = new Hono();

// Enable CORS for browser extension and external clients
app.use('*', cors());

// Routes
app.route('/', rateRouter);

// Start standalone server locally (outside Vercel and test environments)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  console.log(`🚀 Bolívares Scrapper API running at http://localhost:${env.PORT}`);
  serve({
    fetch: app.fetch,
    port: env.PORT,
  });
}

// Export default handler for Vercel Serverless Functions
export default handle(app);
