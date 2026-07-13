"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reportTemplateService } from "@/features/reports/services/report-template-service";
import type { CreateTemplateInput } from "@/features/reports/types/report-template";

const KEY = ["reports", "templates"];

export function useReportTemplates() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: KEY,
    queryFn: async () => reportTemplateService.list(await getToken()),
    enabled: isLoaded && isSignedIn,
  });
}

export function useCreateTemplate() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => reportTemplateService.create(await getToken(), input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTemplate() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => reportTemplateService.remove(await getToken(), id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleFavorite() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) =>
      reportTemplateService.setFavorite(await getToken(), id, value),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useTogglePin() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) =>
      reportTemplateService.setPinned(await getToken(), id, value),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useApplyTemplate() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => reportTemplateService.apply(await getToken(), id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDuplicateTemplate() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => reportTemplateService.duplicate(await getToken(), id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
