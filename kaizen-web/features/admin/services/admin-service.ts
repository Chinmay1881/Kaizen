import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  AdminCategory,
  AdminDepartment,
  AdminUser,
  AdminUserListParams,
  CreateCategoryInput,
  CreateDepartmentInput,
  CreateUserInput,
  PaginationMeta,
  PlatformSetting,
  UpdateCategoryInput,
  UpdateDepartmentInput,
  UpdateUserInput,
} from "@/features/admin/types/admin";

function buildUserListQuery(params: AdminUserListParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.search) search.set("search", params.search);
  if (params.role) search.set("role", params.role);
  if (params.departmentId) search.set("departmentId", params.departmentId);
  if (params.isActive !== undefined) search.set("isActive", String(params.isActive));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const adminService = {
  listUsers: async (
    token: string | null,
    params: AdminUserListParams,
  ): Promise<{ items: AdminUser[]; meta: PaginationMeta }> => {
    const response = await apiClient<ApiSuccessResponse<AdminUser[]>>(
      `/users${buildUserListQuery(params)}`,
      { token: token ?? undefined },
    );
    return {
      items: response.data,
      meta: response.meta ?? {
        page: 1,
        pageSize: response.data.length,
        total: response.data.length,
        totalPages: 1,
      },
    };
  },

  getUser: async (token: string | null, id: string): Promise<AdminUser> => {
    const response = await apiClient<ApiSuccessResponse<AdminUser>>(`/users/${id}`, {
      token: token ?? undefined,
    });
    return response.data;
  },

  createUser: async (token: string | null, input: CreateUserInput): Promise<AdminUser> => {
    const response = await apiClient<ApiSuccessResponse<AdminUser>>("/users", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify(input),
    });
    return response.data;
  },

  updateUser: async (
    token: string | null,
    id: string,
    input: UpdateUserInput,
  ): Promise<AdminUser> => {
    const response = await apiClient<ApiSuccessResponse<AdminUser>>(`/users/${id}`, {
      method: "PATCH",
      token: token ?? undefined,
      body: JSON.stringify(input),
    });
    return response.data;
  },

  listDepartments: async (token: string | null): Promise<AdminDepartment[]> => {
    const response = await apiClient<ApiSuccessResponse<AdminDepartment[]>>("/departments", {
      token: token ?? undefined,
    });
    return response.data;
  },

  createDepartment: async (
    token: string | null,
    input: CreateDepartmentInput,
  ): Promise<AdminDepartment> => {
    const response = await apiClient<ApiSuccessResponse<AdminDepartment>>("/departments", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify(input),
    });
    return response.data;
  },

  updateDepartment: async (
    token: string | null,
    id: string,
    input: UpdateDepartmentInput,
  ): Promise<AdminDepartment> => {
    const response = await apiClient<ApiSuccessResponse<AdminDepartment>>(`/departments/${id}`, {
      method: "PATCH",
      token: token ?? undefined,
      body: JSON.stringify(input),
    });
    return response.data;
  },

  deactivateDepartment: async (token: string | null, id: string): Promise<void> => {
    await apiClient<undefined>(`/departments/${id}`, { method: "DELETE", token: token ?? undefined });
  },

  listCategories: async (token: string | null): Promise<AdminCategory[]> => {
    const response = await apiClient<ApiSuccessResponse<AdminCategory[]>>("/categories", {
      token: token ?? undefined,
    });
    return response.data;
  },

  createCategory: async (
    token: string | null,
    input: CreateCategoryInput,
  ): Promise<AdminCategory> => {
    const response = await apiClient<ApiSuccessResponse<AdminCategory>>("/categories", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify(input),
    });
    return response.data;
  },

  updateCategory: async (
    token: string | null,
    id: string,
    input: UpdateCategoryInput,
  ): Promise<AdminCategory> => {
    const response = await apiClient<ApiSuccessResponse<AdminCategory>>(`/categories/${id}`, {
      method: "PATCH",
      token: token ?? undefined,
      body: JSON.stringify(input),
    });
    return response.data;
  },

  listSettings: async (token: string | null): Promise<PlatformSetting[]> => {
    const response = await apiClient<ApiSuccessResponse<PlatformSetting[]>>("/admin/settings", {
      token: token ?? undefined,
    });
    return response.data;
  },

  updateSettings: async (
    token: string | null,
    settings: Array<{ key: string; value: unknown }>,
  ): Promise<PlatformSetting[]> => {
    const response = await apiClient<ApiSuccessResponse<PlatformSetting[]>>("/admin/settings", {
      method: "PATCH",
      token: token ?? undefined,
      body: JSON.stringify({ settings }),
    });
    return response.data;
  },
};
