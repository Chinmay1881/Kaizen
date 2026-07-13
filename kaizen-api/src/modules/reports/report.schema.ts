import { z } from "zod";

import { KAIZEN_PRIORITIES } from "../../constants/kaizen-priority.js";

export const REPORT_TYPES = [
  "EXECUTIVE_SUMMARY",
  "MONTHLY",
  "DEPARTMENT",
  "EMPLOYEE_PERFORMANCE",
  "KAIZEN_PERFORMANCE",
  "REVIEW_PERFORMANCE",
  "IMPLEMENTATION",
  "BUSINESS_IMPACT",
  "REWARD",
  "LEADERBOARD",
] as const;

export const COMPARISON_PERIODS = ["NONE", "MONTH", "QUARTER", "YEAR"] as const;

/** POST /api/v1/reports/generate body — the Report Builder's full filter surface (Part 3),
 * deliberately mirroring the same filter vocabulary/field names already established for list
 * endpoints in Milestone 11 Chunk 2 (`dateFrom`/`dateTo`, `departmentId`, `categoryId`,
 * `priority`, `status`, plus this chunk's own `employeeId`/`reviewerId`/`implementationOwnerId`/
 * `rewardStatus`/`businessImpactStatus`) rather than inventing a second filter shape. */
export const generateReportSchema = z
  .object({
    reportType: z.enum(REPORT_TYPES),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    departmentId: z.string().uuid().optional(),
    employeeId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    priority: z.enum(KAIZEN_PRIORITIES).optional(),
    status: z.string().trim().max(300).optional(),
    reviewerId: z.string().uuid().optional(),
    implementationOwnerId: z.string().uuid().optional(),
    rewardStatus: z.enum(["ISSUED", "NOT_ISSUED"]).optional(),
    businessImpactStatus: z.enum(["RECORDED", "NOT_RECORDED"]).optional(),
    comparisonPeriod: z.enum(COMPARISON_PERIODS).optional(),
  })
  .strict();

export const reportHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type GenerateReportSchema = z.infer<typeof generateReportSchema>;
export type ReportHistoryQuerySchema = z.infer<typeof reportHistoryQuerySchema>;
