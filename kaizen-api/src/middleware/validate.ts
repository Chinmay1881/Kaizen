import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

import { ApiError } from "../utils/api-error.js";

type RequestPart = "body" | "query" | "params";

export function validate<T>(schema: ZodSchema<T>, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      next(
        new ApiError(
          "VALIDATION_ERROR",
          "Request validation failed.",
          400,
          result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        ),
      );
      return;
    }

    // Express 5 defines `req.query` as a getter-only accessor, so a plain assignment
    // (`req[part] = result.data`) throws for part === "query". `req.body`/`req.params` are
    // still writable, but Object.defineProperty works uniformly for all three and is required
    // for "query" specifically (the property is `configurable: true`, which is what makes this
    // redefinition possible).
    Object.defineProperty(req, part, {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    next();
  };
}
