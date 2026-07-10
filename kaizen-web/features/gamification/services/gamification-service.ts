import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  AchievementDefinition,
  LeaderboardPeriod,
  LeaderboardResult,
  LeaderboardScope,
  UserAchievement,
} from "@/features/gamification/types/gamification";

export const gamificationService = {
  getLeaderboard: async (
    token: string | null,
    params: { period: LeaderboardPeriod; scope: LeaderboardScope; departmentId?: string },
  ): Promise<LeaderboardResult> => {
    const search = new URLSearchParams({ period: params.period, scope: params.scope });
    if (params.departmentId) search.set("departmentId", params.departmentId);

    const response = await apiClient<ApiSuccessResponse<LeaderboardResult>>(
      `/leaderboard?${search.toString()}`,
      { token: token ?? undefined },
    );
    return response.data;
  },

  getAchievements: async (token: string | null): Promise<AchievementDefinition[]> => {
    const response = await apiClient<ApiSuccessResponse<AchievementDefinition[]>>("/achievements", {
      token: token ?? undefined,
    });
    return response.data;
  },

  getUserAchievements: async (token: string | null, userId: string): Promise<UserAchievement[]> => {
    const response = await apiClient<ApiSuccessResponse<UserAchievement[]>>(
      `/users/${userId}/achievements`,
      { token: token ?? undefined },
    );
    return response.data;
  },
};
