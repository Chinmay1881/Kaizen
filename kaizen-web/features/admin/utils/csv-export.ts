import type { AdminUser } from "@/features/admin/types/admin";
import { downloadBlob } from "@/lib/download";

/** Client-side CSV built from already-fetched `AdminUser` rows — there is no export endpoint, and
 * every field written here is a real field already on the type (no fabricated columns). */
export function usersToCsv(users: AdminUser[]): string {
  const header = ["Name", "Email", "Role", "Department", "Status", "Job Title", "Joined", "Last Login"];
  const rows = users.map((user) => [
    user.displayName,
    user.email,
    user.role,
    user.department?.name ?? "",
    user.isActive ? "Active" : "Inactive",
    user.jobTitle ?? "",
    user.createdAt,
    user.lastLoginAt ?? "",
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}
