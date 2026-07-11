import { z } from "zod";

export const SAVED_VIEW_ENTITY_TYPES = [
  "KAIZEN_LIST",
  "REVIEW_QUEUE",
  "IMPLEMENTATION_QUEUE",
  "ADMIN_USERS",
] as const;

export const listSavedViewsQuerySchema = z.object({
  entityType: z.enum(SAVED_VIEW_ENTITY_TYPES),
});

/** `filters` is stored verbatim as the query-string-shaped JSON object the corresponding list
 * endpoint already accepts — validated for shape (plain object of primitives) here, not against
 * each entity's own query schema, since a saved view can reasonably hold a superset/subset as
 * that endpoint's filters evolve. */
export const createSavedViewSchema = z
  .object({
    entityType: z.enum(SAVED_VIEW_ENTITY_TYPES),
    name: z.string().trim().min(1).max(100),
    filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    isDefault: z.boolean().optional(),
    isShared: z.boolean().optional(),
  })
  .strict();

export const updateSavedViewSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    isDefault: z.boolean().optional(),
    isShared: z.boolean().optional(),
  })
  .strict();

export type ListSavedViewsQuerySchema = z.infer<typeof listSavedViewsQuerySchema>;
export type CreateSavedViewSchema = z.infer<typeof createSavedViewSchema>;
export type UpdateSavedViewSchema = z.infer<typeof updateSavedViewSchema>;
