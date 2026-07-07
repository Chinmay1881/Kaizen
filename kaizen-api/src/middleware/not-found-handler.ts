import type { Request, Response } from "express";

import { sendError } from "../utils/api-response.js";

export function notFoundHandler(_req: Request, res: Response) {
  sendError(res, "NOT_FOUND", "Route not found.", 404);
}
