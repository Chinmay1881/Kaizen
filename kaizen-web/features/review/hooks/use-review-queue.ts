"use client";

import { useAuth } from "@clerk/nextjs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { reviewService, type ReviewQueueParams } from "@/features/review/services/review-service";

export function useReviewQueue(params: ReviewQueueParams) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["reviews", "queue", params],
    queryFn: async () => reviewService.getQueue(await getToken(), params),
    enabled: isLoaded && isSignedIn,
    placeholderData: keepPreviousData,
  });
}
