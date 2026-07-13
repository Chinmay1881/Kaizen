import { z } from "zod";

import { generateReportSchema } from "../reports/report.schema.js";

export const EXPORT_FORMATS = ["PDF", "EXCEL", "CSV"] as const;

/** POST /api/v1/reports/exports body — the Report Builder's exact filter surface (Chunk 3A) plus
 * the export `format`. Reusing `generateReportSchema` verbatim keeps this in lockstep with the
 * Report Builder instead of a second, drifting filter schema (Part 9's "no duplicate filtering
 * code" extended to the export engine). */
export const createExportSchema = generateReportSchema.extend({ format: z.enum(EXPORT_FORMATS) }).strict();

export const listExportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateExportSchema = z.infer<typeof createExportSchema>;
export type ListExportsQuerySchema = z.infer<typeof listExportsQuerySchema>;
