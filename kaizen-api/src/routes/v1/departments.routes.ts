import { Router, type Request } from "express";

import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../../modules/departments/department.schema.js";
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

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return req.user;
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

departmentsRouter.post(
  "/",
  requireRole("SUPER_ADMIN"),
  validate(createDepartmentSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const department = await departmentService.create(requester, req.body);
      sendSuccess(res, department, 201);
    } catch (error) {
      next(error);
    }
  },
);

departmentsRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  validate(updateDepartmentSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const department = await departmentService.update(requester, requireParam(req, "id"), req.body);
      sendSuccess(res, department);
    } catch (error) {
      next(error);
    }
  },
);

departmentsRouter.delete("/:id", requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    await departmentService.remove(requester, requireParam(req, "id"));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
