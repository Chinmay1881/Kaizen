import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  CreateSavedViewInput,
  SavedView,
  SavedViewEntityType,
  UpdateSavedViewInput,
} from "@/features/saved-views/types/saved-view";

export const savedViewService = {
  list: async (token: string | null, entityType: SavedViewEntityType): Promise<SavedView[]> => {
    const response = await apiClient<ApiSuccessResponse<SavedView[]>>(
      `/saved-views?entityType=${entityType}`,
      { token: token ?? undefined },
    );
    return response.data;
  },

  create: async (token: string | null, input: CreateSavedViewInput): Promise<SavedView> => {
    const response = await apiClient<ApiSuccessResponse<SavedView>>("/saved-views", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify(input),
    });
    return response.data;
  },

  update: async (token: string | null, id: string, input: UpdateSavedViewInput): Promise<SavedView> => {
    const response = await apiClient<ApiSuccessResponse<SavedView>>(`/saved-views/${id}`, {
      method: "PATCH",
      token: token ?? undefined,
      body: JSON.stringify(input),
    });
    return response.data;
  },

  remove: async (token: string | null, id: string): Promise<void> => {
    await apiClient<undefined>(`/saved-views/${id}`, { method: "DELETE", token: token ?? undefined });
  },
};
