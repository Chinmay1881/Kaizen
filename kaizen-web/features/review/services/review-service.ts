import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { ListKaizensParams, PaginationMeta } from "@/features/kaizen/types/kaizen";
import type {
  ReviewActionInput,
  ReviewActionResult,
  ReviewComment,
  ReviewQueueItem,
} from "@/features/review/types/review";

export interface ReviewQueueParams extends ListKaizensParams {
  departmentId?: string;
}

function buildQueueQuery(params: ReviewQueueParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.status) search.set("status", params.status);
  if (params.categoryId) search.set("categoryId", params.categoryId);
  if (params.departmentId) search.set("departmentId", params.departmentId);
  if (params.priority) search.set("priority", params.priority);
  if (params.search) search.set("search", params.search);
  if (params.sort) search.set("sort", params.sort);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const reviewService = {
  getQueue: async (
    token: string | null,
    params: ReviewQueueParams,
  ): Promise<{ items: ReviewQueueItem[]; meta: PaginationMeta }> => {
    const response = await apiClient<ApiSuccessResponse<ReviewQueueItem[]>>(
      `/reviews/queue${buildQueueQuery(params)}`,
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

  startReview: async (token: string | null, kaizenId: string): Promise<ReviewActionResult> => {
    const response = await apiClient<ApiSuccessResponse<ReviewActionResult>>(
      `/kaizens/${kaizenId}/review/start`,
      { method: "POST", token: token ?? undefined },
    );
    return response.data;
  },

  approve: async (
    token: string | null,
    kaizenId: string,
    input: ReviewActionInput,
  ): Promise<ReviewActionResult> => {
    const response = await apiClient<ApiSuccessResponse<ReviewActionResult>>(
      `/kaizens/${kaizenId}/review/approve`,
      { method: "POST", token: token ?? undefined, body: JSON.stringify(input) },
    );
    return response.data;
  },

  reject: async (
    token: string | null,
    kaizenId: string,
    input: ReviewActionInput,
  ): Promise<ReviewActionResult> => {
    const response = await apiClient<ApiSuccessResponse<ReviewActionResult>>(
      `/kaizens/${kaizenId}/review/reject`,
      { method: "POST", token: token ?? undefined, body: JSON.stringify(input) },
    );
    return response.data;
  },

  requestChanges: async (
    token: string | null,
    kaizenId: string,
    input: ReviewActionInput,
  ): Promise<ReviewActionResult> => {
    const response = await apiClient<ApiSuccessResponse<ReviewActionResult>>(
      `/kaizens/${kaizenId}/review/needs-changes`,
      { method: "POST", token: token ?? undefined, body: JSON.stringify(input) },
    );
    return response.data;
  },

  getComments: async (token: string | null, kaizenId: string): Promise<ReviewComment[]> => {
    const response = await apiClient<ApiSuccessResponse<ReviewComment[]>>(
      `/kaizens/${kaizenId}/comments`,
      { token: token ?? undefined },
    );
    return response.data;
  },

  addComment: async (
    token: string | null,
    kaizenId: string,
    body: string,
  ): Promise<ReviewComment> => {
    const response = await apiClient<ApiSuccessResponse<ReviewComment>>(
      `/kaizens/${kaizenId}/comments`,
      {
        method: "POST",
        token: token ?? undefined,
        body: JSON.stringify({ body, parentId: null }),
      },
    );
    return response.data;
  },

  resolveComment: async (
    token: string | null,
    kaizenId: string,
    commentId: string,
  ): Promise<ReviewComment> => {
    const response = await apiClient<ApiSuccessResponse<ReviewComment>>(
      `/kaizens/${kaizenId}/comments/${commentId}/resolve`,
      { method: "PATCH", token: token ?? undefined },
    );
    return response.data;
  },
};
