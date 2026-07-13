"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reportScheduleService } from "@/features/reports/services/report-schedule-service";
import type { CreateScheduleInput, UpdateScheduleInput } from "@/features/reports/types/report-schedule";

export function useReportSchedules() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["reports", "schedules"],
    queryFn: async () => reportScheduleService.list(await getToken()),
    enabled: isLoaded && isSignedIn,
  });
}

export function useCreateSchedule() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateScheduleInput) => reportScheduleService.create(await getToken(), input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["reports", "schedules"] }),
  });
}

export function useUpdateSchedule() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateScheduleInput }) =>
      reportScheduleService.update(await getToken(), id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["reports", "schedules"] }),
  });
}

export function useDeleteSchedule() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => reportScheduleService.remove(await getToken(), id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["reports", "schedules"] }),
  });
}
