import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { rateRouter } from './routes/rate.js';
import { env } from './schemas/env.js';

const app = new Hono();

// Enable CORS for browser extension and external clients
app.use('*', cors());

// Routes
app.route('/', rateRouter);
app.route('/api/rate', rateRouter);

console.log(`🚀 Bolívares Scrapper API running at http://localhost:${env.PORT}`);

serve({
  fetch: app.fetch,
  port: env.PORT,
});
