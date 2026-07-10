"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { implementationService } from "@/features/implementation/services/implementation-service";
import type { RecordBusinessImpactInput } from "@/features/implementation/types/implementation";

export function useBusinessImpact(kaizenId: string) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["business-impact", kaizenId],
    queryFn: async () => implementationService.getBusinessImpact(await getToken(), kaizenId),
    enabled: isLoaded && isSignedIn && Boolean(kaizenId),
  });
}

export function useRecordBusinessImpact(kaizenId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecordBusinessImpactInput) =>
      implementationService.recordBusinessImpact(await getToken(), kaizenId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["business-impact", kaizenId] });
      void queryClient.invalidateQueries({ queryKey: ["kaizens", "detail", kaizenId] });
      void queryClient.invalidateQueries({ queryKey: ["kaizens", "timeline", kaizenId] });
      void queryClient.invalidateQueries({ queryKey: ["implementations"] });
    },
  });
}
