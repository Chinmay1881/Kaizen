import { clerkMiddleware, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { authService } from "../modules/auth/auth.service.js";
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

/**
 * Resolves the local `users` row for the authenticated Clerk identity and attaches it as
 * `req.user`. Must run after `requireAuth`. Kept separate from `requireAuth` so routes that only
 * need to know "is this a valid Clerk session" (rare) aren't forced to hit the database.
 */
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.auth) {
      throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
    }

    const user = await authService.resolveOrSyncUser(req.auth.clerkId);

    if (!user.isActive) {
      throw new ApiError("FORBIDDEN", "This account has been deactivated.", 403);
    }

    req.user = {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    };

    next();
  } catch (error) {
    next(error);
  }
}
