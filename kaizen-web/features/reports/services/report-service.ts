import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  PaginationMeta,
  ReportBuilderFilters,
  ReportHistoryItem,
  ReportResult,
} from "@/features/reports/types/report";

export const reportService = {
  generate: async (token: string | null, filters: ReportBuilderFilters): Promise<ReportResult> => {
    const response = await apiClient<ApiSuccessResponse<ReportResult>>("/reports/generate", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify(filters),
    });
    return response.data;
  },

  getHistory: async (
    token: string | null,
    params: { page?: number; pageSize?: number },
  ): Promise<{ items: ReportHistoryItem[]; meta: PaginationMeta }> => {
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.pageSize) search.set("pageSize", String(params.pageSize));
    const query = search.toString();
    const response = await apiClient<ApiSuccessResponse<ReportHistoryItem[]>>(
      `/reports/history${query ? `?${query}` : ""}`,
      { token: token ?? undefined },
    );
    return {
      items: response.data,
      meta: response.meta ?? { page: 1, pageSize: response.data.length, total: response.data.length, totalPages: 1 },
    };
  },
};
