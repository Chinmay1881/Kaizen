"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { authService } from "@/features/auth/services/auth-service";

/** The current user's synced profile (role, department, gamification summary) from kaizen-api. */
export function useCurrentUser() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => authService.getMe(await getToken()),
    enabled: isLoaded && isSignedIn,
  });
}
