import type { UserRole } from "@/types/enums";

export interface PermissionCapability {
  id: string;
  label: string;
  description: string;
  /** Minimum role required — every role at or above this level has access. */
  minRole: UserRole;
  group: string;
}

/**
 * Hand-authored from the actual `requireRole(...)` gates in `kaizen-api/src/routes/v1/*.routes.ts`
 * (every route is a "minimum role" gate — `ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole]`,
 * mirrored by `hasMinimumRole` in `lib/permissions.ts`). There is no permissions API to fetch this
 * from — the backend has no roles/capabilities module — so this is a static, read-only reflection
 * of real route guards, not a fetched or invented matrix. Update this list only if a route's
 * `requireRole(...)` call actually changes.
 */
export const PERMISSION_CAPABILITIES: PermissionCapability[] = [
  {
    id: "submit-kaizen",
    label: "Submit & track own Kaizens",
    description: "Create new Kaizens and follow their own submissions through the lifecycle.",
    minRole: "EMPLOYEE",
    group: "Kaizens",
  },
  {
    id: "review-kaizen",
    label: "Review, approve, or reject Kaizens",
    description: "Act on Kaizens submitted by others (POST /reviews).",
    minRole: "DEPARTMENT_MANAGER",
    group: "Kaizens",
  },
  {
    id: "publish-knowledge-base",
    label: "Publish a Kaizen to the Knowledge Base",
    description: "Feature a completed Kaizen company-wide (PATCH /kaizens/:id/publish).",
    minRole: "SUPER_ADMIN",
    group: "Kaizens",
  },
  {
    id: "view-scoring-params",
    label: "View scoring parameters",
    description: "See the weighting behind Kaizen evaluation scores (GET /scoring/parameters).",
    minRole: "DEPARTMENT_MANAGER",
    group: "Kaizens",
  },
  {
    id: "dept-analytics",
    label: "View own department's analytics",
    description: "Department-scoped performance data (GET /analytics/departments).",
    minRole: "DEPARTMENT_MANAGER",
    group: "Analytics & Reports",
  },
  {
    id: "company-analytics",
    label: "View company-wide analytics",
    description: "Cross-department overview and employee leaderboard (GET /analytics/overview, /analytics/employees).",
    minRole: "HR",
    group: "Analytics & Reports",
  },
  {
    id: "reports",
    label: "Build, export, and schedule reports",
    description: "Report Studio, exports, templates, and scheduled deliveries (/reports/*).",
    minRole: "DEPARTMENT_MANAGER",
    group: "Analytics & Reports",
  },
  {
    id: "view-user-detail",
    label: "View another user's profile",
    description: "Look up any individual user's record (GET /users/:id).",
    minRole: "HR",
    group: "People",
  },
  {
    id: "manage-users",
    label: "Create, edit, and deactivate users",
    description: "Full user lifecycle management (POST/PATCH/DELETE /users).",
    minRole: "SUPER_ADMIN",
    group: "People",
  },
  {
    id: "manage-departments",
    label: "Create, edit, and deactivate departments",
    description: "Department structure and manager assignment (POST/PATCH/DELETE /departments).",
    minRole: "SUPER_ADMIN",
    group: "People",
  },
  {
    id: "manage-categories",
    label: "Create and edit Kaizen categories",
    description: "The category list offered in the Submission Wizard (POST/PATCH /categories).",
    minRole: "SUPER_ADMIN",
    group: "Platform",
  },
  {
    id: "platform-settings",
    label: "Manage platform settings",
    description: "Points values, upload limits, and pagination defaults (GET/PATCH /admin/settings).",
    minRole: "SUPER_ADMIN",
    group: "Platform",
  },
];

export const PERMISSION_ROLES: UserRole[] = ["EMPLOYEE", "DEPARTMENT_MANAGER", "HR", "CMD", "SUPER_ADMIN"];
