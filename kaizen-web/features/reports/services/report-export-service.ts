import { apiClient, ApiError, getApiBaseUrl } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { CreateExportInput, ReportExportItem } from "@/features/reports/types/report-export";
import type { PaginationMeta } from "@/features/reports/types/report";

export const reportExportService = {
  create: async (token: string | null, input: CreateExportInput): Promise<ReportExportItem> => {
    const response = await apiClient<ApiSuccessResponse<ReportExportItem>>("/reports/exports", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify(input),
    });
    return response.data;
  },

  list: async (
    token: string | null,
    params: { page?: number; pageSize?: number },
  ): Promise<{ items: ReportExportItem[]; meta: PaginationMeta }> => {
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.pageSize) search.set("pageSize", String(params.pageSize));
    const query = search.toString();
    const response = await apiClient<ApiSuccessResponse<ReportExportItem[]>>(
      `/reports/exports${query ? `?${query}` : ""}`,
      { token: token ?? undefined },
    );
    return {
      items: response.data,
      meta: response.meta ?? { page: 1, pageSize: response.data.length, total: response.data.length, totalPages: 1 },
    };
  },

  getStatus: async (token: string | null, id: string): Promise<ReportExportItem> => {
    const response = await apiClient<ApiSuccessResponse<ReportExportItem>>(`/reports/exports/${id}`, {
      token: token ?? undefined,
    });
    return response.data;
  },

  remove: async (token: string | null, id: string): Promise<void> => {
    await apiClient<null>(`/reports/exports/${id}`, { method: "DELETE", token: token ?? undefined });
  },

  /** Downloads are Bearer-token-authenticated, so a plain `<a href>` to the API can't be used — a
   * blob is fetched client-side and saved via a throwaway object URL + anchor click, the standard
   * pattern for authenticated file downloads in a browser. A `Content-Disposition` filename from
   * the response is preferred; `fallbackFileName` covers the (uncommon) case a proxy strips it. */
  download: async (token: string | null, id: string, fallbackFileName: string): Promise<void> => {
    const response = await fetch(`${getApiBaseUrl()}/reports/exports/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: { code: string; message: string } } | null;
      throw new ApiError(body?.error?.code ?? "INTERNAL_ERROR", body?.error?.message ?? "Download failed.", response.status);
    }
    const disposition = response.headers.get("Content-Disposition");
    const match = disposition ? /filename="(.+)"/.exec(disposition) : null;
    const fileName = match?.[1] ?? fallbackFileName;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },
};
