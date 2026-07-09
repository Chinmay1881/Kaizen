import { Router, type Request } from "express";

import { validate } from "../../middleware/validate.js";
import {
  createKaizenSchema,
  listKaizensQuerySchema,
  updateKaizenSchema,
  type ListKaizensQuerySchema,
} from "../../modules/kaizens/kaizen.schema.js";
import { kaizenService } from "../../modules/kaizens/kaizen.service.js";
import { createCommentSchema, reviewActionSchema } from "../../modules/reviews/review.schema.js";
import { reviewService } from "../../modules/reviews/review.service.js";
import { upsertEvaluationSchema } from "../../modules/scoring/scoring.schema.js";
import { scoringService } from "../../modules/scoring/scoring.service.js";
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

kaizensRouter.post("/:id/review/start", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await reviewService.startReview(requireParam(req, "id"), requester);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.post("/:id/review/approve", validate(reviewActionSchema), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await reviewService.approve(requireParam(req, "id"), requester, req.body.notes);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.post("/:id/review/reject", validate(reviewActionSchema), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await reviewService.reject(requireParam(req, "id"), requester, req.body.notes);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.post(
  "/:id/review/needs-changes",
  validate(reviewActionSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const result = await reviewService.requestChanges(
        requireParam(req, "id"),
        requester,
        req.body.notes,
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
);

kaizensRouter.get("/:id/comments", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const comments = await reviewService.listComments(requireParam(req, "id"), requester);
    sendSuccess(res, comments);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.post("/:id/comments", validate(createCommentSchema), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const comment = await reviewService.addComment(requireParam(req, "id"), requester, req.body);
    sendSuccess(res, comment, 201);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.patch("/:id/comments/:commentId/resolve", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const comment = await reviewService.resolveComment(
      requireParam(req, "id"),
      requireParam(req, "commentId"),
      requester,
    );
    sendSuccess(res, comment);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.get("/:id/evaluation", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const evaluation = await scoringService.getEvaluation(requireParam(req, "id"), requester);
    sendSuccess(res, evaluation);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.put("/:id/evaluation", validate(upsertEvaluationSchema), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const evaluation = await scoringService.upsertEvaluation(
      requireParam(req, "id"),
      requester,
      req.body,
    );
    sendSuccess(res, evaluation);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.post("/:id/evaluation/submit", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const evaluation = await scoringService.submitEvaluation(requireParam(req, "id"), requester);
    sendSuccess(res, evaluation);
  } catch (error) {
    next(error);
  }
});

kaizensRouter.get("/:id/score", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const score = await scoringService.getScore(requireParam(req, "id"), requester);
    sendSuccess(res, score);
  } catch (error) {
    next(error);
  }
});
