"use client";

import { useAuth } from "@clerk/nextjs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { kaizenService } from "@/features/kaizen/services/kaizen-service";
import type { ListKaizensParams } from "@/features/kaizen/types/kaizen";

export function useKaizenList(params: ListKaizensParams) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["kaizens", "list", params],
    queryFn: async () => kaizenService.list(await getToken(), params),
    enabled: isLoaded && isSignedIn,
    placeholderData: keepPreviousData,
  });
}
