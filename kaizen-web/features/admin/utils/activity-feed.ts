import type { AdminDepartment, AdminUser, PlatformSetting } from "@/features/admin/types/admin";

export type AdminActivityType = "user_joined" | "department_updated" | "setting_changed";

export interface AdminActivityEvent {
  id: string;
  type: AdminActivityType;
  title: string;
  actor: string | null;
  timestamp: string;
  tone: "info" | "success" | "warning";
}

/**
 * There is no audit-log read endpoint on the backend (`auditService.record()` is write-only,
 * called internally by other services, with no route exposing it — see the platform-settings,
 * departments, and users services). Rather than invent audit events, this composes a real,
 * disclosed activity feed strictly from timestamped fields already returned by three existing,
 * already-fetched endpoints: new user accounts (`createdAt`), department edits (`updatedAt`, no
 * actor available on that record), and platform setting changes (`updatedAt` + real `updatedBy`).
 * It is a genuine best-effort substitute, not a complete or immutable history.
 */
export function buildActivityFeed(
  users: AdminUser[],
  departments: AdminDepartment[],
  settings: PlatformSetting[],
): AdminActivityEvent[] {
  const events: AdminActivityEvent[] = [];

  for (const user of users) {
    events.push({
      id: `user-${user.id}`,
      type: "user_joined",
      title: `${user.displayName} joined as ${user.role.replace("_", " ").toLowerCase()}`,
      actor: null,
      timestamp: user.createdAt,
      tone: "info",
    });
  }

  for (const department of departments) {
    events.push({
      id: `dept-${department.id}`,
      type: "department_updated",
      title: department.isActive
        ? `Department "${department.name}" was updated`
        : `Department "${department.name}" is inactive`,
      actor: null,
      timestamp: department.updatedAt,
      tone: department.isActive ? "info" : "warning",
    });
  }

  for (const setting of settings) {
    events.push({
      id: `setting-${setting.id}`,
      type: "setting_changed",
      title: `Platform setting "${setting.key}" set to ${String(setting.value)}`,
      actor: setting.updatedBy?.displayName ?? null,
      timestamp: setting.updatedAt,
      tone: "success",
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
