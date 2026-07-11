import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { GroupedSearchResults } from "@/features/search/types/search";

export const searchService = {
  search: async (token: string | null, query: string, limit = 8): Promise<GroupedSearchResults> => {
    const search = new URLSearchParams({ q: query, limit: String(limit) });
    const response = await apiClient<ApiSuccessResponse<GroupedSearchResults>>(
      `/search?${search.toString()}`,
      { token: token ?? undefined },
    );
    return response.data;
  },
};
