import { z } from "zod";

/** POST /api/v1/categories body. No `slug` field — generated server-side from `name`, matching
 * `prisma/seed.ts`'s existing convention (shared `slugify` util). */
export const createCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(255).optional(),
    icon: z.string().trim().max(50).optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .strict();

/** PATCH /api/v1/categories/:id body. No documented DELETE for categories — `isActive` is the
 * only way to retire one, matching `updateDepartmentSchema`'s equivalent field. */
export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(255).nullable().optional(),
    icon: z.string().trim().max(50).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type CreateCategorySchema = z.infer<typeof createCategorySchema>;
export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;
