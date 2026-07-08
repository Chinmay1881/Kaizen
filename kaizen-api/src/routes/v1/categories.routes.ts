import { Router } from "express";

import { categoryService } from "../../modules/categories/category.service.js";
import { sendSuccess } from "../../utils/api-response.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (req, res, next) => {
  try {
    const isActive = req.query.isActive === undefined ? undefined : req.query.isActive === "true";
    const categories = await categoryService.list(isActive);
    sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
});
