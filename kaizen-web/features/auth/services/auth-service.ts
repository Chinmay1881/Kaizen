import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { CurrentUser } from "@/features/auth/types/user";

export interface UpdateCurrentUserInput {
  jobTitle?: string;
  phone?: string;
}

export const authService = {
  getMe: async (token: string | null): Promise<CurrentUser> => {
    const response = await apiClient<ApiSuccessResponse<CurrentUser>>("/me", {
      token: token ?? undefined,
    });
    return response.data;
  },

  updateMe: async (token: string | null, input: UpdateCurrentUserInput): Promise<CurrentUser> => {
    const response = await apiClient<ApiSuccessResponse<CurrentUser>>("/me", {
      method: "PATCH",
      token: token ?? undefined,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return response.data;
  },
};
