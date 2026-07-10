"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { gamificationService } from "@/features/gamification/services/gamification-service";

export function useAchievements() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["gamification", "achievements"],
    queryFn: async () => gamificationService.getAchievements(await getToken()),
    enabled: isLoaded && isSignedIn,
  });
}

export function useUserAchievements(userId: string | undefined) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["gamification", "user-achievements", userId],
    queryFn: async () => gamificationService.getUserAchievements(await getToken(), userId!),
    enabled: isLoaded && isSignedIn && Boolean(userId),
  });
}
