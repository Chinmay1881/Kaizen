import type { UserRole } from "@/types/enums";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  EMPLOYEE: 1,
  DEPARTMENT_MANAGER: 2,
  HR: 3,
  CMD: 4,
  SUPER_ADMIN: 5,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

export function canReview(role: UserRole): boolean {
  return hasMinimumRole(role, "DEPARTMENT_MANAGER");
}
