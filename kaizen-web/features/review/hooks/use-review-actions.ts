"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reviewService } from "@/features/review/services/review-service";
import type { ReviewActionInput } from "@/features/review/types/review";

function useReviewActionMutation(
  action: (token: string | null, kaizenId: string, input: ReviewActionInput) => Promise<unknown>,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kaizenId, notes }: { kaizenId: string; notes?: string }) =>
      action(await getToken(), kaizenId, { notes }),
    onSuccess: (_data, { kaizenId }) => {
      void queryClient.invalidateQueries({ queryKey: ["reviews", "queue"] });
      void queryClient.invalidateQueries({ queryKey: ["kaizens", "detail", kaizenId] });
      void queryClient.invalidateQueries({ queryKey: ["kaizens", "timeline", kaizenId] });
    },
  });
}

/** POST /kaizens/:id/review/start — SUBMITTED -> UNDER_REVIEW. Takes no notes, but shares the
 * same mutation shape as approve/reject/requestChanges for a consistent call site. */
export function useStartReview() {
  return useReviewActionMutation((token, kaizenId) => reviewService.startReview(token, kaizenId));
}

export function useApproveKaizen() {
  return useReviewActionMutation((token, kaizenId, input) =>
    reviewService.approve(token, kaizenId, input),
  );
}

export function useRejectKaizen() {
  return useReviewActionMutation((token, kaizenId, input) =>
    reviewService.reject(token, kaizenId, input),
  );
}

export function useRequestChanges() {
  return useReviewActionMutation((token, kaizenId, input) =>
    reviewService.requestChanges(token, kaizenId, input),
  );
}
