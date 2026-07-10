"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { lookupService } from "@/features/kaizen/services/lookup-service";

export function useCategories() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => lookupService.getCategories(await getToken()),
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
}
