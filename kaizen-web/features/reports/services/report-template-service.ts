import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { CreateTemplateInput, ReportTemplateItem } from "@/features/reports/types/report-template";

export const reportTemplateService = {
  create: async (token: string | null, input: CreateTemplateInput): Promise<ReportTemplateItem> => {
    const response = await apiClient<ApiSuccessResponse<ReportTemplateItem>>("/reports/templates", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify(input),
    });
    return response.data;
  },

  list: async (token: string | null): Promise<ReportTemplateItem[]> => {
    const response = await apiClient<ApiSuccessResponse<ReportTemplateItem[]>>("/reports/templates", {
      token: token ?? undefined,
    });
    return response.data;
  },

  remove: async (token: string | null, id: string): Promise<void> => {
    await apiClient<null>(`/reports/templates/${id}`, { method: "DELETE", token: token ?? undefined });
  },

  setFavorite: async (token: string | null, id: string, value: boolean): Promise<ReportTemplateItem> => {
    const response = await apiClient<ApiSuccessResponse<ReportTemplateItem>>(`/reports/templates/${id}/favorite`, {
      method: "PATCH",
      token: token ?? undefined,
      body: JSON.stringify({ value }),
    });
    return response.data;
  },

  setPinned: async (token: string | null, id: string, value: boolean): Promise<ReportTemplateItem> => {
    const response = await apiClient<ApiSuccessResponse<ReportTemplateItem>>(`/reports/templates/${id}/pin`, {
      method: "PATCH",
      token: token ?? undefined,
      body: JSON.stringify({ value }),
    });
    return response.data;
  },

  apply: async (token: string | null, id: string): Promise<ReportTemplateItem> => {
    const response = await apiClient<ApiSuccessResponse<ReportTemplateItem>>(`/reports/templates/${id}/apply`, {
      method: "POST",
      token: token ?? undefined,
    });
    return response.data;
  },

  duplicate: async (token: string | null, id: string): Promise<ReportTemplateItem> => {
    const response = await apiClient<ApiSuccessResponse<ReportTemplateItem>>(`/reports/templates/${id}/duplicate`, {
      method: "POST",
      token: token ?? undefined,
    });
    return response.data;
  },
};
