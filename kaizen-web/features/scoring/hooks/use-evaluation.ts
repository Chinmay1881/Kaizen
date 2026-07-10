"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { scoringService } from "@/features/scoring/services/scoring-service";

export function useEvaluation(kaizenId: string) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["scoring", "evaluation", kaizenId],
    queryFn: async () => scoringService.getEvaluation(await getToken(), kaizenId),
    enabled: isLoaded && isSignedIn && Boolean(kaizenId),
  });
}
