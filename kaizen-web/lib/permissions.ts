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

/**
 * Per-Kaizen review-ACTION authorization (start review, approve, reject, needs changes, save/
 * submit evaluation, assign implementation) — distinct from `canReview` above, which gates
 * broader reviewer-level access (Reports, Analytics, nav visibility) and intentionally includes
 * HR. HR can view and comment on a Kaizen but cannot take review actions on it.
 *
 * Mirrors the backend's `assertCanManage` exactly (`ReviewService`/`ScoringService`/
 * `ImplementationService`, kaizen-api): Department Manager only within their own department; CMD
 * and Super Admin as enterprise-wide overrides that can act on any Kaizen; HR and Employee
 * excluded. Milestone 20 — restores this after the Milestone 13 Review Workspace rebuild
 * regressed the frontend to Department-Manager-only, hiding review actions from CMD/Super Admin.
 */
export function canManageKaizenReview(
  user: { role: UserRole; department?: { id: string } | null },
  kaizen: { department: { id: string } },
): boolean {
  if (user.role === "SUPER_ADMIN" || user.role === "CMD") return true;
  return user.role === "DEPARTMENT_MANAGER" && user.department?.id === kaizen.department.id;
}

/** Mirrors the backend's `COMPANY_WIDE_ROLES` (kaizen-api analytics/report services) — HR, CMD,
 * and Super Admin see company-wide data; Department Manager sees only their own department. */
export function canViewCompanyAnalytics(role: UserRole): boolean {
  return hasMinimumRole(role, "HR");
}

const EDIT_ALLOWED_STATUSES = new Set(["DRAFT", "SUBMITTED", "NEEDS_CHANGES"]);

/** Mirrors the backend's `assertCanEdit` exactly (kaizen.service.ts, kaizen-api) — the submitter
 * (or Super Admin) may edit a Kaizen only in DRAFT, SUBMITTED, or NEEDS_CHANGES. Everything past
 * UNDER_REVIEW is locked. Purely a UI gate (hide/disable the Edit entry point) — the backend
 * enforces this independently regardless of what the frontend shows. */
export function canEditKaizen(
  kaizen: { status: string; submitter: { id: string } },
  user: { id: string; role: UserRole },
): boolean {
  const isOwner = kaizen.submitter.id === user.id;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  if (!isOwner && !isSuperAdmin) return false;
  return EDIT_ALLOWED_STATUSES.has(kaizen.status);
}
