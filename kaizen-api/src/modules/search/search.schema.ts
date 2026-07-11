import { z } from "zod";

/** GET /api/v1/search query params. */
export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export type SearchQuerySchema = z.infer<typeof searchQuerySchema>;
