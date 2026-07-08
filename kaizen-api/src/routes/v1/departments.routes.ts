import { Router } from "express";

import { departmentService } from "../../modules/departments/department.service.js";
import { sendSuccess } from "../../utils/api-response.js";

export const departmentsRouter = Router();

departmentsRouter.get("/", async (req, res, next) => {
  try {
    const isActive = req.query.isActive === undefined ? undefined : req.query.isActive === "true";
    const departments = await departmentService.list(isActive);
    sendSuccess(res, departments);
  } catch (error) {
    next(error);
  }
});
