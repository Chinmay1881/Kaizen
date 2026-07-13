import { Router, type Request } from "express";
import { z } from "zod";

import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  createTemplateSchema,
  updateTemplateSchema,
  type CreateTemplateSchema,
  type UpdateTemplateSchema,
} from "../../modules/report-templates/report-template.schema.js";
import { reportTemplateService } from "../../modules/report-templates/report-template.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

export const reportTemplatesRouter = Router();

const toggleSchema = z.object({ value: z.boolean() }).strict();

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

reportTemplatesRouter.post(
  "/",
  requireRole("DEPARTMENT_MANAGER"),
  validate(createTemplateSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const result = await reportTemplateService.create(requester, req.body as CreateTemplateSchema);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  },
);

reportTemplatesRouter.get("/", requireRole("DEPARTMENT_MANAGER"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await reportTemplateService.list(requester);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

reportTemplatesRouter.patch(
  "/:id",
  requireRole("DEPARTMENT_MANAGER"),
  validate(updateTemplateSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const result = await reportTemplateService.update(requester, requireParam(req, "id"), req.body as UpdateTemplateSchema);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
);

reportTemplatesRouter.delete("/:id", requireRole("DEPARTMENT_MANAGER"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    await reportTemplateService.remove(requester, requireParam(req, "id"));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

reportTemplatesRouter.patch(
  "/:id/favorite",
  requireRole("DEPARTMENT_MANAGER"),
  validate(toggleSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const { value } = req.body as z.infer<typeof toggleSchema>;
      const result = await reportTemplateService.setFavorite(requester, requireParam(req, "id"), value);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
);

reportTemplatesRouter.patch(
  "/:id/pin",
  requireRole("DEPARTMENT_MANAGER"),
  validate(toggleSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const { value } = req.body as z.infer<typeof toggleSchema>;
      const result = await reportTemplateService.setPinned(requester, requireParam(req, "id"), value);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
);

reportTemplatesRouter.post("/:id/apply", requireRole("DEPARTMENT_MANAGER"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await reportTemplateService.markUsed(requester, requireParam(req, "id"));
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

reportTemplatesRouter.post("/:id/duplicate", requireRole("DEPARTMENT_MANAGER"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await reportTemplateService.duplicate(requester, requireParam(req, "id"));
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
});
