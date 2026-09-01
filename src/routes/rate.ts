import { Hono } from 'hono';
import { getBcvRate } from '../services/scraper.js';

const rateRouter = new Hono();

/**
 * GET / 
 * Responds with { date: string, rate: number, exposed: boolean }
 */
rateRouter.get('/', async (c) => {
  try {
    const rateData = await getBcvRate();
    return c.json(rateData, 200);
  } catch (error: any) {
    return c.json(
      {
        error: error?.message || 'Failed to retrieve exchange rate from BCV',
      },
      500,
    );
  }
});

export { rateRouter };
