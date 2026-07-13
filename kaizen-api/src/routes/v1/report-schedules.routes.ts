import { Router, type Request } from "express";

import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  createScheduleSchema,
  updateScheduleSchema,
  type CreateScheduleSchema,
  type UpdateScheduleSchema,
} from "../../modules/report-schedules/report-schedule.schema.js";
import { reportScheduleService } from "../../modules/report-schedules/report-schedule.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

export const reportSchedulesRouter = Router();

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

reportSchedulesRouter.post(
  "/",
  requireRole("DEPARTMENT_MANAGER"),
  validate(createScheduleSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const result = await reportScheduleService.create(requester, req.body as CreateScheduleSchema);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  },
);

reportSchedulesRouter.get("/", requireRole("DEPARTMENT_MANAGER"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await reportScheduleService.list(requester);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

reportSchedulesRouter.patch(
  "/:id",
  requireRole("DEPARTMENT_MANAGER"),
  validate(updateScheduleSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const result = await reportScheduleService.update(requester, requireParam(req, "id"), req.body as UpdateScheduleSchema);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
);

reportSchedulesRouter.delete("/:id", requireRole("DEPARTMENT_MANAGER"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    await reportScheduleService.remove(requester, requireParam(req, "id"));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
