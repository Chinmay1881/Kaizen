"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { kaizenService } from "@/features/kaizen/services/kaizen-service";

export function useKaizenDetail(id: string) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["kaizens", "detail", id],
    queryFn: async () => kaizenService.get(await getToken(), id),
    enabled: isLoaded && isSignedIn && Boolean(id),
  });
}
