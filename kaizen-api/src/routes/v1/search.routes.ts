import { Router, type Request } from "express";

import { searchService } from "../../modules/search/search.service.js";
import { searchQuerySchema, type SearchQuerySchema } from "../../modules/search/search.schema.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

export const searchRouter = Router();

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return req.user;
}

searchRouter.get("/", validate(searchQuerySchema, "query"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const { q, limit } = req.query as unknown as SearchQuerySchema;
    const results = await searchService.search(requester, q, limit);
    sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
});
