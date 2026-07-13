"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reportExportService } from "@/features/reports/services/report-export-service";
import type { CreateExportInput } from "@/features/reports/types/report-export";

export function useCreateExport() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExportInput) => reportExportService.create(await getToken(), input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["reports", "exports"] }),
  });
}

/** Part 10 — "Show loading progress": polls every 3s while any export on the current page is
 * still PENDING/PROCESSING, and stops once everything has settled. */
export function useReportExports(params: { page?: number; pageSize?: number }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["reports", "exports", params],
    queryFn: async () => reportExportService.list(await getToken(), params),
    enabled: isLoaded && isSignedIn,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const stillWorking = items.some((item) => item.status === "PENDING" || item.status === "PROCESSING");
      return stillWorking ? 3000 : false;
    },
  });
}

export function useDeleteExport() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => reportExportService.remove(await getToken(), id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["reports", "exports"] }),
  });
}

export function useDownloadExport() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, fileName }: { id: string; fileName: string }) =>
      reportExportService.download(await getToken(), id, fileName),
  });
}
