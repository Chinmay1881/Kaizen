import { Router, type Request } from "express";

import { savedViewService } from "../../modules/saved-views/saved-view.service.js";
import {
  createSavedViewSchema,
  listSavedViewsQuerySchema,
  updateSavedViewSchema,
  type ListSavedViewsQuerySchema,
} from "../../modules/saved-views/saved-view.schema.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

export const savedViewsRouter = Router();

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

savedViewsRouter.get(
  "/",
  validate(listSavedViewsQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const { entityType } = req.query as unknown as ListSavedViewsQuerySchema;
      const views = await savedViewService.list(requester, entityType);
      sendSuccess(res, views);
    } catch (error) {
      next(error);
    }
  },
);

savedViewsRouter.post("/", validate(createSavedViewSchema), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const view = await savedViewService.create(requester, req.body);
    sendSuccess(res, view, 201);
  } catch (error) {
    next(error);
  }
});

savedViewsRouter.patch("/:id", validate(updateSavedViewSchema), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const view = await savedViewService.update(requester, requireParam(req, "id"), req.body);
    sendSuccess(res, view);
  } catch (error) {
    next(error);
  }
});

savedViewsRouter.delete("/:id", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    await savedViewService.remove(requester, requireParam(req, "id"));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
