import type { UserRole } from "../../constants/roles.js";

export interface AdminUserItem {
  id: string;
  /** Permanent, assigned once at creation — never editable, not part of `UpdateUserSchema`. */
  employeeCode: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: UserRole;
  department: { id: string; name: string; code: string } | null;
  jobTitle: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PaginatedAdminUsers {
  items: AdminUserItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
