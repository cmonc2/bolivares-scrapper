import * as cheerio from 'cheerio';
import { Agent, ProxyAgent, fetch as undiciFetch } from 'undici';
import { RateResponse, RateResponseSchema } from '../schemas/rate.js';
import { env } from '../schemas/env.js';

const BCV_URL = 'https://www.bcv.org.ve/';
const DEFAULT_PROXY_URL = env.VPN_PROXY_URL;

let cachedRate: RateResponse | null = null;
let lastScrapedTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory cache

// Direct Agent configured to bypass BCV self-signed/broken certificate chain errors
const directAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

export function clearRateCache(): void {
  cachedRate = null;
  lastScrapedTime = 0;
}

export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export async function fetchHtml(proxyUrl?: string): Promise<string> {
  const dispatcher = proxyUrl
    ? new ProxyAgent({
        uri: proxyUrl,
        requestTls: {
          rejectUnauthorized: false,
        },
      })
    : directAgent;

  const response = await undiciFetch(BCV_URL, {
    dispatcher,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`BCV responded with status ${response.status}`);
  }

  return await response.text();
}

export function extractRateFromHtml(html: string): number {
  const $ = cheerio.load(html);
  const rawRateText = $('#dolar strong').text().trim();

  if (!rawRateText) {
    throw new Error('USD rate container (#dolar strong) not found in BCV page HTML.');
  }

  const formattedRate = rawRateText.replace(',', '.');
  const parsedRate = parseFloat(formattedRate);

  if (isNaN(parsedRate)) {
    throw new Error(`Failed to parse extracted rate text: "${rawRateText}"`);
  }

  return parseFloat(parsedRate.toFixed(2));
}

/**
 * Retrieves the BCV USD exchange rate.
 * - On Vercel: Fetches directly through Vercel's cloud infrastructure (exposed: false).
 * - Locally: Tries VPN proxy first (exposed: false), with fallback to direct connection (exposed: true).
 * Returns { date, rate, exposed }.
 */
export async function getBcvRate(): Promise<RateResponse> {
  const now = Date.now();
  if (cachedRate && now - lastScrapedTime < CACHE_TTL_MS) {
    return cachedRate;
  }

  let html: string | null = null;
  let isExposed = false;

  // 1. Vercel Cloud: Requests originate from Vercel servers (IP protected)
  if (process.env.VERCEL) {
    html = await fetchHtml();
    isExposed = false;
    console.log('[Scraper] Scraped BCV via Vercel Cloud Serverless (protected).');
  } else {
    // 2. Local Environment: Attempt to scrape using the local VPN proxy first
    try {
      html = await fetchHtml(DEFAULT_PROXY_URL);
      isExposed = false;
      console.log('[Scraper] Scraped BCV via client-vpn proxy (protected).');
    } catch (vpnError: any) {
      console.warn(
        `[Scraper] VPN proxy unavailable (${vpnError?.message || vpnError}). Falling back to direct connection...`,
      );
    }

    // Fallback to direct fetch if VPN did not yield HTML
    if (!html) {
      try {
        html = await fetchHtml();
        isExposed = true;
        console.log('[Scraper] Scraped BCV directly (exposed).');
      } catch (directError: any) {
        console.error(`[Scraper] Direct scrape also failed: ${directError?.message || directError}`);
        if (cachedRate) {
          console.log('[Scraper] Returning previous cached rate as emergency fallback.');
          return cachedRate;
        }
        throw new Error(`Scraping failed: ${directError?.message || 'Unknown network error'}`);
      }
    }
  }

  // Extract and validate rate
  const rate = extractRateFromHtml(html);
  const date = getTodayDate();

  const validatedData = RateResponseSchema.parse({
    date,
    rate,
    exposed: isExposed,
  });

  cachedRate = validatedData;
  lastScrapedTime = now;

  return validatedData;
}
