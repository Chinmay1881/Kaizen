"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

/** Syncs a flat filter-state object to the URL's query string (Part 2 — "URL should preserve
 * filters"). `defaults` doubles as both the initial value for any param not present in the URL
 * and the "this is the empty/unset value" sentinel — setting a filter back to its default removes
 * it from the URL instead of writing e.g. `?status=`. Changing any filter other than `page` resets
 * pagination, matching every list page's existing "new filter = back to page 1" behavior. */
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as Array<keyof T>) {
      const value = searchParams.get(String(key));
      if (value !== null) result[key] = value as T[typeof key];
    }
    return result;
  }, [searchParams, defaults]);

  const setFilters = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const key of Object.keys(updates) as Array<keyof T>) {
        const value = updates[key];
        if (value === undefined || value === "" || value === defaults[key]) {
          params.delete(String(key));
        } else {
          params.set(String(key), String(value));
        }
      }
      if (!("page" in updates) && params.has("page")) params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, defaults],
  );

  const replaceAll = useCallback(
    (next: Partial<T>) => {
      const params = new URLSearchParams();
      for (const key of Object.keys(next) as Array<keyof T>) {
        const value = next[key];
        if (value !== undefined && value !== "" && value !== defaults[key]) {
          params.set(String(key), String(value));
        }
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, defaults],
  );

  const resetFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return { filters, setFilters, replaceAll, resetFilters };
}
