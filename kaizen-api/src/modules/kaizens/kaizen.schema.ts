import { z } from "zod";

import { KAIZEN_PRIORITIES, ESTIMATED_IMPACTS } from "../../constants/kaizen-priority.js";

export const createKaizenSchema = z.object({
  title: z.string().trim().max(120).optional(),
  departmentId: z.string().uuid().optional(),
});

const fiveW1HSchema = z
  .object({
    what: z.string().trim().max(2000).optional(),
    whereLocation: z.string().trim().max(2000).optional(),
    whenOccurs: z.string().trim().max(2000).optional(),
    who: z.string().trim().max(2000).optional(),
    why: z.string().trim().max(2000).optional(),
    how: z.string().trim().max(2000).optional(),
  })
  .optional();

const fiveWhySchema = z
  .array(
    z.object({
      level: z.number().int().min(1).max(5),
      answer: z.string().trim().min(1).max(1000),
    }),
  )
  .max(5)
  .optional();

const benefitSchema = z
  .array(
    z.object({
      benefitType: z.string().trim().min(1).max(50),
      description: z.string().trim().min(1).max(500),
      isCustom: z.boolean().optional(),
    }),
  )
  .optional();

export const updateKaizenSchema = z
  .object({
    title: z.string().trim().min(10).max(120).optional(),
    categoryId: z.string().uuid().optional(),
    priority: z.enum(KAIZEN_PRIORITIES).optional(),
    estimatedImpact: z.enum(ESTIMATED_IMPACTS).optional(),
    location: z.string().trim().max(120).optional(),
    problemStatement: z.string().trim().min(1).max(1000).optional(),
    currentProcess: z.string().trim().min(1).max(1500).optional(),
    proposedSolution: z.string().trim().min(1).max(1500).optional(),
    fiveW1H: fiveW1HSchema,
    fiveWhy: fiveWhySchema,
    benefits: benefitSchema,
  })
  .strict();

/** GET /kaizens query params. `limit` is accepted as an alias for `pageSize` for convenience.
 * Milestone 11 Chunk 2 added `dateFrom`/`dateTo` (created-at range). */
export const listKaizensQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().trim().max(300).optional(),
  categoryId: z.string().uuid().optional(),
  priority: z.enum(KAIZEN_PRIORITIES).optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(["newest", "oldest", "updated"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateKaizenSchema = z.infer<typeof createKaizenSchema>;
export type UpdateKaizenSchema = z.infer<typeof updateKaizenSchema>;
export type ListKaizensQuerySchema = z.infer<typeof listKaizensQuerySchema>;
