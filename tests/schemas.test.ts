import { describe, expect, it } from 'vitest';
import { RateResponseSchema } from '../src/schemas/rate.js';
import { EnvSchema } from '../src/schemas/env.js';

describe('RateResponseSchema', () => {
  it('validates a correct rate response object', () => {
    const validData = {
      date: '2026-09-01',
      rate: 798.33,
      exposed: false,
    };

    const parsed = RateResponseSchema.parse(validData);
    expect(parsed).toEqual(validData);
    expect(Object.keys(parsed)).toEqual(['date', 'rate', 'exposed']);
  });

  it('rejects invalid date formats', () => {
    const invalidDates = ['01-09-2026', '2026/09/01', '2026-9-1', 'invalid-date'];

    invalidDates.forEach((date) => {
      expect(() =>
        RateResponseSchema.parse({
          date,
          rate: 100.5,
          exposed: true,
        }),
      ).toThrow();
    });
  });

  it('rejects negative or zero rates', () => {
    expect(() =>
      RateResponseSchema.parse({
        date: '2026-09-01',
        rate: -5,
        exposed: false,
      }),
    ).toThrow();

    expect(() =>
      RateResponseSchema.parse({
        date: '2026-09-01',
        rate: 0,
        exposed: false,
      }),
    ).toThrow();
  });
});

describe('EnvSchema', () => {
  it('provides safe default values when environment variables are missing', () => {
    const env = EnvSchema.parse({});
    expect(env.PORT).toBe(3000);
    expect(env.VPN_PROXY_URL).toBe('http://localhost:8888');
    expect(env.TZ).toBe('America/Caracas');
  });

  it('coerces string PORT to number', () => {
    const env = EnvSchema.parse({ PORT: '8080' });
    expect(env.PORT).toBe(8080);
  });
});
