import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { Category, Department, DepartmentUser } from "@/features/kaizen/types/lookup";

export const lookupService = {
  getDepartments: async (token: string | null): Promise<Department[]> => {
    const response = await apiClient<ApiSuccessResponse<Department[]>>("/departments", {
      token: token ?? undefined,
    });
    return response.data;
  },

  getCategories: async (token: string | null): Promise<Category[]> => {
    const response = await apiClient<ApiSuccessResponse<Category[]>>("/categories", {
      token: token ?? undefined,
    });
    return response.data;
  },

  getDepartmentUsers: async (
    token: string | null,
    departmentId: string,
  ): Promise<DepartmentUser[]> => {
    const response = await apiClient<ApiSuccessResponse<DepartmentUser[]>>(
      `/departments/${departmentId}/users`,
      { token: token ?? undefined },
    );
    return response.data;
  },
};
