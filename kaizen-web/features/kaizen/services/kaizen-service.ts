import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  CreateKaizenInput,
  KaizenAttachment,
  KaizenDetail,
  KaizenListItem,
  ListKaizensParams,
  PaginationMeta,
  SubmitKaizenResult,
  TimelineEventItem,
  UpdateKaizenInput,
} from "@/features/kaizen/types/kaizen";

function buildListQuery(params: ListKaizensParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.status) search.set("status", params.status);
  if (params.categoryId) search.set("categoryId", params.categoryId);
  if (params.priority) search.set("priority", params.priority);
  if (params.search) search.set("search", params.search);
  if (params.sort) search.set("sort", params.sort);
  if (params.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params.dateTo) search.set("dateTo", params.dateTo);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const kaizenService = {
  create: async (token: string | null, input: CreateKaizenInput): Promise<KaizenDetail> => {
    const response = await apiClient<ApiSuccessResponse<KaizenDetail>>("/kaizens", {
      method: "POST",
      token: token ?? undefined,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return response.data;
  },

  get: async (token: string | null, id: string): Promise<KaizenDetail> => {
    const response = await apiClient<ApiSuccessResponse<KaizenDetail>>(`/kaizens/${id}`, {
      token: token ?? undefined,
    });
    return response.data;
  },

  update: async (
    token: string | null,
    id: string,
    input: UpdateKaizenInput,
  ): Promise<KaizenDetail> => {
    const response = await apiClient<ApiSuccessResponse<KaizenDetail>>(`/kaizens/${id}`, {
      method: "PATCH",
      token: token ?? undefined,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return response.data;
  },

  remove: async (token: string | null, id: string): Promise<void> => {
    await apiClient<undefined>(`/kaizens/${id}`, {
      method: "DELETE",
      token: token ?? undefined,
    });
  },

  submit: async (token: string | null, id: string): Promise<SubmitKaizenResult> => {
    const response = await apiClient<ApiSuccessResponse<SubmitKaizenResult>>(
      `/kaizens/${id}/submit`,
      { method: "POST", token: token ?? undefined },
    );
    return response.data;
  },

  list: async (
    token: string | null,
    params: ListKaizensParams,
  ): Promise<{ items: KaizenListItem[]; meta: PaginationMeta }> => {
    const response = await apiClient<ApiSuccessResponse<KaizenListItem[]>>(
      `/kaizens${buildListQuery(params)}`,
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

  getTimeline: async (token: string | null, id: string): Promise<TimelineEventItem[]> => {
    const response = await apiClient<ApiSuccessResponse<TimelineEventItem[]>>(
      `/kaizens/${id}/timeline`,
      { token: token ?? undefined },
    );
    return response.data;
  },

  uploadAttachment: async (
    token: string | null,
    id: string,
    file: File,
  ): Promise<KaizenAttachment> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient<ApiSuccessResponse<KaizenAttachment>>(
      `/kaizens/${id}/attachments`,
      { method: "POST", token: token ?? undefined, body: formData },
    );
    return response.data;
  },

  deleteAttachment: async (
    token: string | null,
    id: string,
    attachmentId: string,
  ): Promise<void> => {
    await apiClient<undefined>(`/kaizens/${id}/attachments/${attachmentId}`, {
      method: "DELETE",
      token: token ?? undefined,
    });
  },
};
