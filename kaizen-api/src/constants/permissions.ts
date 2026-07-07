import type { UserRole } from "./roles.js";

export const PERMISSIONS = {
  REVIEW_KAIZEN: ["DEPARTMENT_MANAGER", "HR", "CMD", "SUPER_ADMIN"] as UserRole[],
  APPROVE_KAIZEN: ["DEPARTMENT_MANAGER"] as UserRole[],
  MANAGE_USERS: ["SUPER_ADMIN"] as UserRole[],
  VIEW_AUDIT_LOGS: ["CMD", "SUPER_ADMIN"] as UserRole[],
};
