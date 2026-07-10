"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { scoringService } from "@/features/scoring/services/scoring-service";

export function useKaizenScore(kaizenId: string) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["scoring", "score", kaizenId],
    queryFn: async () => scoringService.getScore(await getToken(), kaizenId),
    enabled: isLoaded && isSignedIn && Boolean(kaizenId),
  });
}
