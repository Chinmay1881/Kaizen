import { z } from "zod";

/** Shared by every analytics endpoint's optional date-range filter. */
export const dateRangeQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const departmentAnalyticsQuerySchema = dateRangeQuerySchema.extend({
  departmentId: z.string().uuid().optional(),
});

/** GET /api/v1/analytics/trends — matches the API spec's documented query params exactly. */
export const trendsQuerySchema = dateRangeQuerySchema.extend({
  metric: z.enum(["submissions", "approvals", "implementations"]).default("submissions"),
  granularity: z.enum(["day", "week", "month"]).default("month"),
});

export type DateRangeQuerySchema = z.infer<typeof dateRangeQuerySchema>;
export type DepartmentAnalyticsQuerySchema = z.infer<typeof departmentAnalyticsQuerySchema>;
export type TrendsQuerySchema = z.infer<typeof trendsQuerySchema>;
