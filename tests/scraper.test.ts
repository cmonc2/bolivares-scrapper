import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import {
  clearRateCache,
  extractRateFromHtml,
  getBcvRate,
} from '../src/services/scraper.js';

describe('BCV Scraper Service', () => {
  beforeEach(() => {
    clearRateCache();
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.VERCEL;
  });

  describe('extractRateFromHtml', () => {
    it('extracts and formats USD rate correctly from BCV DOM', () => {
      const rate = extractRateFromHtml(MOCK_BCV_HTML);
      expect(rate).toBe(798.33);
    });

    it('throws error when #dolar strong element is missing', () => {
      const invalidHtml = '<html><body><div>No rate here</div></body></html>';
      expect(() => extractRateFromHtml(invalidHtml)).toThrow(
        'USD rate container (#dolar strong) not found in BCV page HTML.',
      );
    });
  });

  describe('getBcvRate Environment Transports', () => {
    it('in Vercel Cloud: fetches directly and reports exposed: false', async () => {
      process.env.VERCEL = '1';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => MOCK_BCV_HTML,
      });

      const result = await getBcvRate();

      expect(result.rate).toBe(798.33);
      expect(result.exposed).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('in Local Environment with active VPN: uses proxy and reports exposed: false', async () => {
      delete process.env.VERCEL;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => MOCK_BCV_HTML,
      });

      const result = await getBcvRate();

      expect(result.rate).toBe(798.33);
      expect(result.exposed).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('in Local Environment when VPN fails: falls back to direct and reports exposed: true', async () => {
      delete process.env.VERCEL;

      // 1st call (VPN) fails, 2nd call (direct) succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Connection to VPN proxy failed'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => MOCK_BCV_HTML,
        });

      const result = await getBcvRate();

      expect(result.rate).toBe(798.33);
      expect(result.exposed).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
