import { Router } from "express";

import { requireRole } from "../../middleware/rbac.js";
import { scoringService } from "../../modules/scoring/scoring.service.js";
import { sendSuccess } from "../../utils/api-response.js";

export const scoringRouter = Router();

/** "Auth: Department Manager+" per the API spec — Employees blocked via role hierarchy. */
scoringRouter.get("/parameters", requireRole("DEPARTMENT_MANAGER"), async (_req, res, next) => {
  try {
    const parameters = await scoringService.getParameters();
    sendSuccess(res, parameters);
  } catch (error) {
    next(error);
  }
});
