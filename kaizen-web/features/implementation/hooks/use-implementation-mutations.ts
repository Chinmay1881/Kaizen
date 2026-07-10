"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { implementationService } from "@/features/implementation/services/implementation-service";
import type {
  AssignImplementationInput,
  CompleteImplementationInput,
  UpdateImplementationInput,
  VerifyImplementationInput,
} from "@/features/implementation/types/implementation";

function useInvalidateImplementation(kaizenId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["implementations", "detail", kaizenId] });
    void queryClient.invalidateQueries({ queryKey: ["implementations", "list"] });
    void queryClient.invalidateQueries({ queryKey: ["kaizens", "detail", kaizenId] });
    void queryClient.invalidateQueries({ queryKey: ["kaizens", "timeline", kaizenId] });
  };
}

export function useAssignImplementation(kaizenId: string) {
  const { getToken } = useAuth();
  const invalidate = useInvalidateImplementation(kaizenId);

  return useMutation({
    mutationFn: async (input: AssignImplementationInput) =>
      implementationService.assign(await getToken(), kaizenId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateImplementationProgress(kaizenId: string) {
  const { getToken } = useAuth();
  const invalidate = useInvalidateImplementation(kaizenId);

  return useMutation({
    mutationFn: async (input: UpdateImplementationInput) =>
      implementationService.updateProgress(await getToken(), kaizenId, input),
    onSuccess: invalidate,
  });
}

export function useCompleteImplementation(kaizenId: string) {
  const { getToken } = useAuth();
  const invalidate = useInvalidateImplementation(kaizenId);

  return useMutation({
    mutationFn: async (input: CompleteImplementationInput) =>
      implementationService.complete(await getToken(), kaizenId, input),
    onSuccess: invalidate,
  });
}

export function useVerifyImplementation(kaizenId: string) {
  const { getToken } = useAuth();
  const invalidate = useInvalidateImplementation(kaizenId);

  return useMutation({
    mutationFn: async (input: VerifyImplementationInput) =>
      implementationService.verify(await getToken(), kaizenId, input),
    onSuccess: invalidate,
  });
}
