import { z } from "zod";

import { generateReportSchema } from "../reports/report.schema.js";
import { EXPORT_FORMATS } from "../report-exports/report-export.schema.js";

export const SCHEDULE_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const;

/** POST /api/v1/reports/schedules body — reuses the Report Builder's exact filter surface
 * (`generateReportSchema`, including `reportType`/`departmentId`/`categoryId` — Part 6's "Choose
 * Report Type... Department, Category" are already fields on it) plus scheduling-specific fields. */
export const createScheduleSchema = generateReportSchema
  .extend({
    frequency: z.enum(SCHEDULE_FREQUENCIES),
    format: z.enum(EXPORT_FORMATS).default("PDF"),
    recipientIds: z.array(z.string().uuid()).min(1).max(50),
    isEnabled: z.boolean().optional(),
  })
  .strict();

export const updateScheduleSchema = createScheduleSchema.partial().strict();

export type CreateScheduleSchema = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleSchema = z.infer<typeof updateScheduleSchema>;
