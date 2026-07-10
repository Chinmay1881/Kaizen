import { Router, type Request } from "express";

import { validate } from "../../middleware/validate.js";
import {
  listImplementationsQuerySchema,
  type ListImplementationsQuerySchema,
} from "../../modules/implementations/implementation.schema.js";
import { implementationService } from "../../modules/implementations/implementation.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

export const implementationsRouter = Router();

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return req.user;
}

/** Broader than the Review queue's RBAC: Employees get read-only access to their own Kaizens'
 * implementations here, per the API spec, so no `requireRole` gate — role-based scoping happens
 * inside the service. */
implementationsRouter.get(
  "/",
  validate(listImplementationsQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const { items, meta } = await implementationService.list(
        requester,
        req.query as unknown as ListImplementationsQuerySchema,
      );
      sendSuccess(res, items, 200, meta);
    } catch (error) {
      next(error);
    }
  },
);
