"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reportService } from "@/features/reports/services/report-service";
import type { ReportBuilderFilters } from "@/features/reports/types/report";

export function useGenerateReport() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filters: ReportBuilderFilters) => reportService.generate(await getToken(), filters),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["reports", "history"] }),
  });
}

export function useReportHistory(params: { page?: number; pageSize?: number }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["reports", "history", params],
    queryFn: async () => reportService.getHistory(await getToken(), params),
    enabled: isLoaded && isSignedIn,
  });
}
