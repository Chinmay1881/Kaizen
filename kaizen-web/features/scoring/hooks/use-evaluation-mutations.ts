"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { scoringService } from "@/features/scoring/services/scoring-service";
import type { UpsertEvaluationInput } from "@/features/scoring/types/evaluation";

export function useUpsertEvaluation(kaizenId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertEvaluationInput) =>
      scoringService.upsertEvaluation(await getToken(), kaizenId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["scoring", "evaluation", kaizenId] });
    },
  });
}

export function useSubmitEvaluation(kaizenId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => scoringService.submitEvaluation(await getToken(), kaizenId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["scoring", "evaluation", kaizenId] });
      void queryClient.invalidateQueries({ queryKey: ["kaizens", "timeline", kaizenId] });
      void queryClient.invalidateQueries({ queryKey: ["scoring", "score", kaizenId] });
    },
  });
}
