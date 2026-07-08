import { Router, type Request } from "express";

import { validate } from "../../middleware/validate.js";
import {
  createKaizenSchema,
  listKaizensQuerySchema,
  updateKaizenSchema,
  type ListKaizensQuerySchema,
} from "../../modules/kaizens/kaizen.schema.js";
import { kaizenService } from "../../modules/kaizens/kaizen.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

export const kaizensRouter = Router();

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return req.user;
}

/** Express types route params as `string | string[]` (array form only applies to wildcard
 * segments, never `:id`) — narrow it so service methods can take a plain `string`. */
function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string") {
    throw new ApiError("VALIDATION_ERROR", `Missing route parameter "${name}".`, 400);
  }
  return value;
}

kaizensRouter.post("/", validate(createKaizenSchema), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const kaizen = await kaizenService.createDraft(requester, req.body);
    sendSuccess(res, kaizen, 201);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.get("/", validate(listKaizensQuerySchema, "query"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const { items, meta } = await kaizenService.list(
      requester,
      req.query as unknown as ListKaizensQuerySchema,
    );
    sendSuccess(res, items, 200, meta);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.get("/:id/timeline", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const events = await kaizenService.getTimeline(requireParam(req, "id"), requester);
    sendSuccess(res, events);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.get("/:id", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const kaizen = await kaizenService.getById(requireParam(req, "id"), requester);
    sendSuccess(res, kaizen);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.patch("/:id", validate(updateKaizenSchema), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const kaizen = await kaizenService.update(requireParam(req, "id"), requester, req.body);
    sendSuccess(res, kaizen);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.delete("/:id", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    await kaizenService.remove(requireParam(req, "id"), requester);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

kaizensRouter.post("/:id/submit", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await kaizenService.submit(requireParam(req, "id"), requester);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});
