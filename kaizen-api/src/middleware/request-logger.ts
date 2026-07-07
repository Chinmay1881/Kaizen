import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  if (env.LOG_LEVEL === "debug") {
    console.log(`[${req.method}] ${req.originalUrl}`);
  }

  next();
}
