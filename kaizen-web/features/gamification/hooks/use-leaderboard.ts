"use client";

import { useAuth } from "@clerk/nextjs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { gamificationService } from "@/features/gamification/services/gamification-service";
import type { LeaderboardPeriod, LeaderboardScope } from "@/features/gamification/types/gamification";

export function useLeaderboard(params: {
  period: LeaderboardPeriod;
  scope: LeaderboardScope;
  departmentId?: string;
}) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["gamification", "leaderboard", params],
    queryFn: async () => gamificationService.getLeaderboard(await getToken(), params),
    enabled: isLoaded && isSignedIn && (params.scope !== "DEPARTMENT" || Boolean(params.departmentId)),
    placeholderData: keepPreviousData,
  });
}
