"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { reviewService } from "@/features/review/services/review-service";

export function useReviewComments(kaizenId: string) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["reviews", "comments", kaizenId],
    queryFn: async () => reviewService.getComments(await getToken(), kaizenId),
    enabled: isLoaded && isSignedIn && Boolean(kaizenId),
  });
}
