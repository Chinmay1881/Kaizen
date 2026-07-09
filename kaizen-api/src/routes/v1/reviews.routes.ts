import { Router, type Request } from "express";

import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  reviewQueueQuerySchema,
  type ReviewQueueQuerySchema,
} from "../../modules/reviews/review.schema.js";
import { reviewService } from "../../modules/reviews/review.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

export const reviewsRouter = Router();

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return req.user;
}

/** Employees are rejected here (hierarchy floor is DEPARTMENT_MANAGER) before ReviewService ever
 * runs — matches the RBAC table: Dept Manager (dept only), HR/CMD/Super Admin (all). */
reviewsRouter.get(
  "/queue",
  requireRole("DEPARTMENT_MANAGER"),
  validate(reviewQueueQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const { items, meta } = await reviewService.getQueue(
        requester,
        req.query as unknown as ReviewQueueQuerySchema,
      );
      sendSuccess(res, items, 200, meta);
    } catch (error) {
      next(error);
    }
  },
);
