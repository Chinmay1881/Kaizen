import type { UserRole } from "@/types/enums";

export interface AdminUser {
  id: string;
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

export interface AdminUserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  departmentId?: string;
  isActive?: boolean;
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId?: string;
}

export interface UpdateUserInput {
  role?: UserRole;
  departmentId?: string | null;
  isActive?: boolean;
}

export interface AdminDepartment {
  id: string;
  name: string;
  code: string;
  managerId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
  managerId?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  managerId?: string | null;
  isActive?: boolean;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updatedBy: { id: string; displayName: string } | null;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
