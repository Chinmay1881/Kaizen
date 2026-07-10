import { Router, type Request } from "express";

import { validate } from "../../middleware/validate.js";
import {
  pointsHistoryQuerySchema,
  type PointsHistoryQuerySchema,
} from "../../modules/gamification/gamification.schema.js";
import { gamificationService } from "../../modules/gamification/gamification.service.js";
import { rewardService } from "../../modules/rewards/reward.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

/** Only the 3 gamification-adjacent sub-routes documented under `/users/:id/...` in
 * docs/engineering/02_API_SPECIFICATION.md's Gamification/Rewards sections. Admin user
 * management (list/create/update/deactivate users) is Admin Panel scope — a later roadmap item,
 * not part of Milestone 9 — and is intentionally not added here. */
export const usersRouter = Router();

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return req.user;
}

function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string") {
    throw new ApiError("VALIDATION_ERROR", `Missing route parameter "${name}".`, 400);
  }
  return value;
}

usersRouter.get("/:id/achievements", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const achievements = await gamificationService.getUserAchievements(
      requireParam(req, "id"),
      requester,
    );
    sendSuccess(res, achievements);
  } catch (error) {
    next(error);
  }
});

usersRouter.get(
  "/:id/points",
  validate(pointsHistoryQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const { items, meta } = await gamificationService.getUserPoints(
        requireParam(req, "id"),
        requester,
        req.query as unknown as PointsHistoryQuerySchema,
      );
      sendSuccess(res, items, 200, meta);
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.get(
  "/:id/rewards",
  validate(pointsHistoryQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const { items, meta } = await rewardService.getHistory(
        requireParam(req, "id"),
        requester,
        req.query as unknown as PointsHistoryQuerySchema,
      );
      sendSuccess(res, items, 200, meta);
    } catch (error) {
      next(error);
    }
  },
);
