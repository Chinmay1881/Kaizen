import { Router, type Request } from "express";

import { departmentService } from "../../modules/departments/department.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

export const departmentsRouter = Router();

/** Express types route params as `string | string[]` — narrow it, matching kaizens.routes.ts. */
function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string") {
    throw new ApiError("VALIDATION_ERROR", `Missing route parameter "${name}".`, 400);
  }
  return value;
}

departmentsRouter.get("/", async (req, res, next) => {
  try {
    const isActive = req.query.isActive === undefined ? undefined : req.query.isActive === "true";
    const departments = await departmentService.list(isActive);
    sendSuccess(res, departments);
  } catch (error) {
    next(error);
  }
});

/** Milestone 8: powers the Implementation "assign owner" picker. Auth: any authenticated user —
 * matches the existing GET / (department list), which is also unrestricted ("Auth: Required, all
 * roles" per the API spec). */
departmentsRouter.get("/:id/users", async (req, res, next) => {
  try {
    const users = await departmentService.listUsers(requireParam(req, "id"));
    sendSuccess(res, users);
  } catch (error) {
    next(error);
  }
});
