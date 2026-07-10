"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { kaizenService } from "@/features/kaizen/services/kaizen-service";

export function useKaizenTimeline(id: string) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["kaizens", "timeline", id],
    queryFn: async () => kaizenService.getTimeline(await getToken(), id),
    enabled: isLoaded && isSignedIn && Boolean(id),
  });
}
