"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { scoringService } from "@/features/scoring/services/scoring-service";

export function useScoringParameters() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["scoring", "parameters"],
    queryFn: async () => scoringService.getParameters(await getToken()),
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
}
