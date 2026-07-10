"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { implementationService } from "@/features/implementation/services/implementation-service";

export function useImplementation(kaizenId: string) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["implementations", "detail", kaizenId],
    queryFn: async () => implementationService.get(await getToken(), kaizenId),
    enabled: isLoaded && isSignedIn && Boolean(kaizenId),
  });
}
