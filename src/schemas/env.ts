import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  VPN_PROXY_URL: z.string().default('http://localhost:8888'),
  TZ: z.string().default('America/Caracas'),
});

export const env = EnvSchema.parse(process.env);
