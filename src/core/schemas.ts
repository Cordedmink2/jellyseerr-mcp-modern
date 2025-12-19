import { z } from 'zod';

export const pingOutputSchema = z.object({
  ok: z.literal(true),
  service: z.string(),
  transport: z.string(),
});

export const searchMediaInputSchema = z.object({
  query: z.string().min(1, 'query is required'),
  limit: z.number().int().positive().max(100).default(20),
});

export const requestMediaInputSchema = z.object({
  mediaId: z.number().int().positive(),
  mediaType: z.enum(['movie', 'tv']),
  is4k: z.boolean().default(false),
});

export const getRequestInputSchema = z.object({
  requestId: z.number().int().positive(),
});

export const rawRequestInputSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  endpoint: z.string().min(1),
  params: z.record(z.string(), z.any()).optional(),
  body: z.record(z.string(), z.any()).optional(),
});
