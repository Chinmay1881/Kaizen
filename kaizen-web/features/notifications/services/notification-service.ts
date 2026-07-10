import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  Notification,
  NotificationListParams,
  PaginationMeta,
} from "@/features/notifications/types/notification";

function buildListQuery(params: NotificationListParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.isRead !== undefined) search.set("isRead", String(params.isRead));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const notificationService = {
  list: async (
    token: string | null,
    params: NotificationListParams,
  ): Promise<{ items: Notification[]; meta: PaginationMeta }> => {
    const response = await apiClient<ApiSuccessResponse<Notification[]>>(
      `/notifications${buildListQuery(params)}`,
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

  getUnreadCount: async (token: string | null): Promise<{ count: number }> => {
    const response = await apiClient<ApiSuccessResponse<{ count: number }>>(
      "/notifications/unread-count",
      { token: token ?? undefined },
    );
    return response.data;
  },

  markRead: async (token: string | null, id: string): Promise<Notification> => {
    const response = await apiClient<ApiSuccessResponse<Notification>>(
      `/notifications/${id}/read`,
      { method: "PATCH", token: token ?? undefined },
    );
    return response.data;
  },

  markAllRead: async (token: string | null): Promise<{ markedRead: number }> => {
    const response = await apiClient<ApiSuccessResponse<{ markedRead: number }>>(
      "/notifications/read-all",
      { method: "POST", token: token ?? undefined },
    );
    return response.data;
  },
};
