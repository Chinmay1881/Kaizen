import { Router, type Request } from "express";

import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  type ListUsersQuerySchema,
} from "../../modules/admin/admin-user.schema.js";
import { adminUserService } from "../../modules/admin/admin-user.service.js";
import {
  pointsHistoryQuerySchema,
  type PointsHistoryQuerySchema,
} from "../../modules/gamification/gamification.schema.js";
import { gamificationService } from "../../modules/gamification/gamification.service.js";
import { rewardService } from "../../modules/rewards/reward.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

/** The Admin ("Users (Admin)") CRUD routes plus the 3 gamification-adjacent sub-routes documented
 * under `/users/:id/...` in the Gamification/Rewards sections (Milestone 9). */
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

usersRouter.get(
  "/",
  requireRole("SUPER_ADMIN"),
  validate(listUsersQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const { items, meta } = await adminUserService.list(req.query as unknown as ListUsersQuerySchema);
      sendSuccess(res, items, 200, meta);
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.get("/:id", requireRole("HR"), async (req, res, next) => {
  try {
    const user = await adminUserService.getById(requireParam(req, "id"));
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/", requireRole("SUPER_ADMIN"), validate(createUserSchema), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const user = await adminUserService.create(requester, req.body);
    sendSuccess(res, user, 201);
  } catch (error) {
    next(error);
  }
});

usersRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const user = await adminUserService.update(requester, requireParam(req, "id"), req.body);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.delete("/:id", requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    await adminUserService.remove(requester, requireParam(req, "id"));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

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
