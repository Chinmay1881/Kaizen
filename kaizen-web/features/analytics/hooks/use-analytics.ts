"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { analyticsService } from "@/features/analytics/services/analytics-service";
import type { AnalyticsDateRange } from "@/features/analytics/types/analytics";

export function useAnalyticsOverview(range: AnalyticsDateRange = {}, enabled = true) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["analytics", "overview", range],
    queryFn: async () => analyticsService.getOverview(await getToken(), range),
    enabled: isLoaded && isSignedIn && enabled,
  });
}

export function useDepartmentAnalytics(departmentId?: string, enabled = true) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["analytics", "departments", departmentId ?? "all"],
    queryFn: async () => analyticsService.getDepartments(await getToken(), departmentId),
    enabled: isLoaded && isSignedIn && enabled,
  });
}

export function usePersonalAnalytics() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["analytics", "personal"],
    queryFn: async () => analyticsService.getPersonal(await getToken()),
    enabled: isLoaded && isSignedIn,
  });
}

export function useEmployeesAnalytics(enabled = true) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["analytics", "employees"],
    queryFn: async () => analyticsService.getEmployees(await getToken()),
    enabled: isLoaded && isSignedIn && enabled,
  });
}
