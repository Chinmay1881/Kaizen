import type { NextFunction, Request, Response } from "express";

import type { UserRole } from "../constants/roles.js";
import { ApiError } from "../utils/api-error.js";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  EMPLOYEE: 1,
  DEPARTMENT_MANAGER: 2,
  HR: 3,
  CMD: 4,
  SUPER_ADMIN: 5,
};

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role;

    if (!role) {
      next(new ApiError("UNAUTHORIZED", "User context not found.", 401));
      return;
    }

    const hasAccess = allowedRoles.some(
      (allowedRole) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[allowedRole],
    );

    if (!hasAccess) {
      next(new ApiError("FORBIDDEN", "Insufficient permissions.", 403));
      return;
    }

    next();
  };
}
