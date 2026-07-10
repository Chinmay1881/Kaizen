import { Router, type Request } from "express";

import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../../modules/categories/category.schema.js";
import { categoryService } from "../../modules/categories/category.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

export const categoriesRouter = Router();

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

categoriesRouter.get("/", async (req, res, next) => {
  try {
    const isActive = req.query.isActive === undefined ? undefined : req.query.isActive === "true";
    const categories = await categoryService.list(isActive);
    sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
});

categoriesRouter.post(
  "/",
  requireRole("SUPER_ADMIN"),
  validate(createCategorySchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const category = await categoryService.create(requester, req.body);
      sendSuccess(res, category, 201);
    } catch (error) {
      next(error);
    }
  },
);

categoriesRouter.patch(
  "/:id",
  requireRole("SUPER_ADMIN"),
  validate(updateCategorySchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const category = await categoryService.update(requester, requireParam(req, "id"), req.body);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  },
);
