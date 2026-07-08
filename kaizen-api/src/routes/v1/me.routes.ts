import { Router } from "express";

import { authService } from "../../modules/auth/auth.service.js";
import { updateMeSchema } from "../../modules/auth/auth.schema.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

export const meRouter = Router();

meRouter.get("/", async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
    }

    const me = await authService.getMe(req.user.id);
    sendSuccess(res, me);
  } catch (error) {
    next(error);
  }
});

meRouter.patch("/", validate(updateMeSchema), async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
    }

    const me = await authService.updateProfile(req.user.id, req.body);
    sendSuccess(res, me);
  } catch (error) {
    next(error);
  }
});
