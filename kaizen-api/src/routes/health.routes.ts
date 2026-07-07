import { Router } from "express";

import { sendSuccess } from "../utils/api-response.js";
import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  sendSuccess(res, {
    status: "ok",
    service: "kaizen-api",
    version: env.API_VERSION,
    timestamp: new Date().toISOString(),
  });
});
