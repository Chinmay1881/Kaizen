import type { UserRole } from "@/types/enums";

export const USER_ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "DEPARTMENT_MANAGER", label: "Department Manager" },
  { value: "HR", label: "HR" },
  { value: "CMD", label: "CMD" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];
