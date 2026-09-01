import { beforeEach, describe, expect, it, vi } from 'vitest';

const MOCK_BCV_HTML = `
  <!DOCTYPE html>
  <html>
    <body>
      <div id="dolar">
        <span>USD</span>
        <strong> 798,33 </strong>
      </div>
    </body>
  </html>
`;

// Hoisted mock for undici fetch
const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

vi.mock('undici', () => ({
  Agent: class {},
  ProxyAgent: class {},
  fetch: mockFetch,
}));

import { app } from '../src/index.js';
import { clearRateCache } from '../src/services/scraper.js';

describe('Hono API Routes', () => {
  beforeEach(() => {
    clearRateCache();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => MOCK_BCV_HTML,
    });
  });

  it('GET / returns 200 with date, rate, and exposed in correct order', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('date');
    expect(data).toHaveProperty('rate', 798.33);
    expect(data).toHaveProperty('exposed');
    expect(Object.keys(data)).toEqual(['date', 'rate', 'exposed']);
  });
});
