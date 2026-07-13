import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { CreateScheduleInput, ReportScheduleItem, UpdateScheduleInput } from "@/features/reports/types/report-schedule";

export const reportScheduleService = {
  create: async (token: string | null, input: CreateScheduleInput): Promise<ReportScheduleItem> => {
    const response = await apiClient<ApiSuccessResponse<ReportScheduleItem>>("/reports/schedules", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify(input),
    });
    return response.data;
  },

  list: async (token: string | null): Promise<ReportScheduleItem[]> => {
    const response = await apiClient<ApiSuccessResponse<ReportScheduleItem[]>>("/reports/schedules", {
      token: token ?? undefined,
    });
    return response.data;
  },

  update: async (token: string | null, id: string, input: UpdateScheduleInput): Promise<ReportScheduleItem> => {
    const response = await apiClient<ApiSuccessResponse<ReportScheduleItem>>(`/reports/schedules/${id}`, {
      method: "PATCH",
      token: token ?? undefined,
      body: JSON.stringify(input),
    });
    return response.data;
  },

  remove: async (token: string | null, id: string): Promise<void> => {
    await apiClient<null>(`/reports/schedules/${id}`, { method: "DELETE", token: token ?? undefined });
  },
};
