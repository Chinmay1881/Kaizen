import { Router, type Request } from "express";

import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { reportService } from "../../modules/reports/report.service.js";
import {
  generateReportSchema,
  reportHistoryQuerySchema,
  type GenerateReportSchema,
  type ReportHistoryQuerySchema,
} from "../../modules/reports/report.schema.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

/** "Visible to: HR, CMD, Super Admin, Department Manager (Department reports only)" — the route
 * floor is Department Manager (matches `canReview`'s hierarchy on the frontend); the finer-grained
 * "Department Manager can only generate DEPARTMENT reports" rule lives in
 * `ReportService.assertCanGenerate`, since it depends on the request body, not just the role. */
export const reportsRouter = Router();

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return req.user;
}

reportsRouter.post(
  "/generate",
  requireRole("DEPARTMENT_MANAGER"),
  validate(generateReportSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const result = await reportService.generateReport(requester, req.body as GenerateReportSchema);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  },
);

reportsRouter.get(
  "/history",
  requireRole("DEPARTMENT_MANAGER"),
  validate(reportHistoryQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const { items, meta } = await reportService.getHistory(
        requester,
        req.query as unknown as ReportHistoryQuerySchema,
      );
      sendSuccess(res, items, 200, meta);
    } catch (error) {
      next(error);
    }
  },
);
