import { Router, type Request } from "express";

import { analyticsService } from "../../modules/analytics/analytics.service.js";
import {
  dateRangeQuerySchema,
  departmentAnalyticsQuerySchema,
  trendsQuerySchema,
  type DateRangeQuerySchema,
  type DepartmentAnalyticsQuerySchema,
  type TrendsQuerySchema,
} from "../../modules/analytics/analytics.schema.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

export const analyticsRouter = Router();

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return req.user;
}

/** "Auth: HR, CMD, Super Admin" per the API spec. */
analyticsRouter.get(
  "/overview",
  requireRole("HR"),
  validate(dateRangeQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const overview = await analyticsService.getOverview(req.query as unknown as DateRangeQuerySchema);
      sendSuccess(res, overview);
    } catch (error) {
      next(error);
    }
  },
);

/** "Auth: Dept Manager (own dept), HR, CMD, Super Admin" — `requireRole("DEPARTMENT_MANAGER")`
 * lets everyone from Department Manager up through; scoping to "own department only" for a
 * Department Manager happens in the service, matching `ReviewService.getQueue`'s established
 * pattern. */
analyticsRouter.get(
  "/departments",
  requireRole("DEPARTMENT_MANAGER"),
  validate(departmentAnalyticsQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const items = await analyticsService.getDepartmentAnalytics(
        requester,
        req.query as unknown as DepartmentAnalyticsQuerySchema,
      );
      sendSuccess(res, items);
    } catch (error) {
      next(error);
    }
  },
);

/** "Auth: HR, CMD, Super Admin" per the API spec. */
analyticsRouter.get("/employees", requireRole("HR"), async (_req, res, next) => {
  try {
    const items = await analyticsService.getEmployeesAnalytics();
    sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
});

/** "Auth: Scoped by role" — Employee sees only their own Kaizens, Department Manager their
 * department's, HR/CMD/Super Admin everything (see `AnalyticsService.scopeForRequester`). */
analyticsRouter.get("/kaizens", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await analyticsService.getKaizenAnalytics(requester);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

/** "Auth: HR, CMD, Super Admin" per the API spec. */
analyticsRouter.get(
  "/trends",
  requireRole("HR"),
  validate(trendsQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const points = await analyticsService.getTrends(req.query as unknown as TrendsQuerySchema);
      sendSuccess(res, points);
    } catch (error) {
      next(error);
    }
  },
);

/** "Auth: Required (self)" per the API spec — always the requester's own analytics. */
analyticsRouter.get("/personal", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await analyticsService.getPersonalAnalytics(requester.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});
