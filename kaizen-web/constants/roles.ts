import type { UserRole } from "@/types/enums";

export const ROLE_LABELS: Record<UserRole, string> = {
  EMPLOYEE: "Employee",
  DEPARTMENT_MANAGER: "Department Manager",
  HR: "HR",
  CMD: "CMD",
  SUPER_ADMIN: "Super Admin",
};
