import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/api-error.js";
import { sendError } from "../utils/api-response.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    sendError(res, error.code, error.message, error.statusCode, error.details);
    return;
  }

  console.error("[kaizen-api] Unhandled error:", error);
  sendError(res, "INTERNAL_ERROR", "An unexpected error occurred.", 500);
}
