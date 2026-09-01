import { z } from 'zod';

export const RateResponseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be formatted as YYYY-MM-DD' }),
  rate: z.number().positive({ message: 'Rate must be a positive number' }),
  exposed: z.boolean(),
});

export type RateResponse = z.infer<typeof RateResponseSchema>;
