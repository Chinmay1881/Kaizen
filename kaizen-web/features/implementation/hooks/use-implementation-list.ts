"use client";

import { useAuth } from "@clerk/nextjs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { implementationService } from "@/features/implementation/services/implementation-service";
import type { ImplementationListParams } from "@/features/implementation/types/implementation";

export function useImplementationList(params: ImplementationListParams) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["implementations", "list", params],
    queryFn: async () => implementationService.list(await getToken(), params),
    enabled: isLoaded && isSignedIn,
    placeholderData: keepPreviousData,
  });
}
