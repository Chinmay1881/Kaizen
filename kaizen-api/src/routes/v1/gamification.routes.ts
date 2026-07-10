import { Router } from "express";

import { validate } from "../../middleware/validate.js";
import {
  leaderboardQuerySchema,
  type LeaderboardQuerySchema,
} from "../../modules/gamification/gamification.schema.js";
import { gamificationService } from "../../modules/gamification/gamification.service.js";
import { sendSuccess } from "../../utils/api-response.js";

/** Mounted at the v1 root (not `/gamification`) so its routes resolve to the API spec's exact,
 * unprefixed paths: `GET /api/v1/leaderboard`, `GET /api/v1/achievements`. */
export const gamificationRouter = Router();

gamificationRouter.get(
  "/leaderboard",
  validate(leaderboardQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const { period, scope, departmentId } = req.query as unknown as LeaderboardQuerySchema;
      const result = await gamificationService.getLeaderboard(period, scope, departmentId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
);

gamificationRouter.get("/achievements", async (_req, res, next) => {
  try {
    const achievements = await gamificationService.getAchievements();
    sendSuccess(res, achievements);
  } catch (error) {
    next(error);
  }
});
