"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { lookupService } from "@/features/kaizen/services/lookup-service";

/** Powers the Implementation "assign owner" picker (Milestone 8) — only fetches once a
 * department has actually been picked. */
export function useDepartmentUsers(departmentId: string) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["departments", departmentId, "users"],
    queryFn: async () => lookupService.getDepartmentUsers(await getToken(), departmentId),
    enabled: isLoaded && isSignedIn && Boolean(departmentId),
    staleTime: 60 * 1000,
  });
}
