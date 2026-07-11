import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  AnalyticsDateRange,
  AnalyticsOverview,
  DepartmentAnalyticsItem,
  EmployeeAnalytics,
} from "@/features/analytics/types/analytics";

function buildDateRangeQuery(range: AnalyticsDateRange): string {
  const search = new URLSearchParams();
  if (range.dateFrom) search.set("dateFrom", range.dateFrom);
  if (range.dateTo) search.set("dateTo", range.dateTo);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const analyticsService = {
  getOverview: async (token: string | null, range: AnalyticsDateRange): Promise<AnalyticsOverview> => {
    const response = await apiClient<ApiSuccessResponse<AnalyticsOverview>>(
      `/analytics/overview${buildDateRangeQuery(range)}`,
      { token: token ?? undefined },
    );
    return response.data;
  },

  getDepartments: async (
    token: string | null,
    departmentId?: string,
  ): Promise<DepartmentAnalyticsItem[]> => {
    const search = new URLSearchParams();
    if (departmentId) search.set("departmentId", departmentId);
    const query = search.toString();
    const response = await apiClient<ApiSuccessResponse<DepartmentAnalyticsItem[]>>(
      `/analytics/departments${query ? `?${query}` : ""}`,
      { token: token ?? undefined },
    );
    return response.data;
  },

  getPersonal: async (token: string | null): Promise<EmployeeAnalytics> => {
    const response = await apiClient<ApiSuccessResponse<EmployeeAnalytics>>("/analytics/personal", {
      token: token ?? undefined,
    });
    return response.data;
  },
};
