import { z } from "zod";

/** GET /leaderboard query params — matches the API spec exactly ("departmentId required when
 * scope=DEPARTMENT" is enforced in the service, not here, since it depends on the value of
 * another field). */
export const leaderboardQuerySchema = z.object({
  period: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ALL_TIME"]).default("MONTHLY"),
  scope: z.enum(["COMPANY", "DEPARTMENT"]).default("COMPANY"),
  departmentId: z.string().uuid().optional(),
});

export type LeaderboardQuerySchema = z.infer<typeof leaderboardQuerySchema>;

/** GET /users/:id/points query params — pagination only. */
export const pointsHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type PointsHistoryQuerySchema = z.infer<typeof pointsHistoryQuerySchema>;
