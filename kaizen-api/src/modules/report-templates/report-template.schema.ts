import { z } from "zod";

import { generateReportSchema } from "../reports/report.schema.js";

/** POST /api/v1/reports/templates body — the Report Builder's exact filter surface plus the two
 * template-only fields Part 7 lists ("Charts enabled", "Columns") that `SavedView` (Chunk 2) was
 * never designed to hold. */
export const createTemplateSchema = generateReportSchema
  .extend({
    name: z.string().trim().min(1).max(150),
    chartsEnabled: z.boolean().optional(),
    columns: z.array(z.string().trim().min(1)).max(20).optional(),
  })
  .strict();

export const updateTemplateSchema = createTemplateSchema.partial().strict();

export type CreateTemplateSchema = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateSchema = z.infer<typeof updateTemplateSchema>;
