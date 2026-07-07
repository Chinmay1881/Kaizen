import { clerkMiddleware, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

export const clerkAuth = clerkMiddleware({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
    }

    req.auth = {
      clerkId: auth.userId,
      sessionId: auth.sessionId ?? null,
    };

    next();
  } catch (error) {
    next(error);
  }
}
