"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { useDebounce } from "@/hooks/use-debounce";
import { searchService } from "@/features/search/services/search-service";

/** Debounced (Part 8 — Performance) so typing doesn't fire an API call per keystroke. */
export function useGlobalSearch(query: string) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const debounced = useDebounce(query.trim(), 250);

  return useQuery({
    queryKey: ["search", debounced],
    queryFn: async () => searchService.search(await getToken(), debounced),
    enabled: isLoaded && isSignedIn && debounced.length > 0,
  });
}
