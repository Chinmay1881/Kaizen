"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reviewService } from "@/features/review/services/review-service";

export function useAddComment(kaizenId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => reviewService.addComment(await getToken(), kaizenId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews", "comments", kaizenId] });
      void queryClient.invalidateQueries({ queryKey: ["kaizens", "timeline", kaizenId] });
    },
  });
}

export function useResolveComment(kaizenId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) =>
      reviewService.resolveComment(await getToken(), kaizenId, commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews", "comments", kaizenId] });
    },
  });
}
