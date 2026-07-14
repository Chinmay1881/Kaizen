"use client";

import { useCallback, useState } from "react";

const STORAGE_PREFIX = "kaizen:recent-searches:";
const MAX_RECENT = 10;

/** `namespace` keeps separate recent-search lists per search context (e.g. the Review Inbox vs.
 * the global command palette) without colliding — omitted, it's the exact key format the command
 * palette already uses, so existing stored searches there are unaffected. */
function storageKey(userId: string, namespace?: string): string {
  return namespace ? `${STORAGE_PREFIX}${namespace}:${userId}` : `${STORAGE_PREFIX}${userId}`;
}

function readStored(userId: string, namespace?: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId, namespace));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

/** Recent Searches (Part 5) — localStorage rather than a new DB table: "per user" here means
 * per Clerk account on this browser, which fully satisfies "last 10, clickable, clear history"
 * without adding schema for what is, at most, a convenience list a user can always just retype. */
export function useRecentSearches(userId: string | undefined, namespace?: string) {
  const [recent, setRecent] = useState<string[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | undefined>(undefined);
  const loadKey = userId ? `${namespace ?? ""}:${userId}` : undefined;

  // "Adjusting state when a prop changes" (react.dev) rather than an effect — avoids the extra
  // render-then-sync cascade a useEffect-based reset would trigger every time `userId` resolves.
  if (loadKey !== loadedFor) {
    setLoadedFor(loadKey);
    setRecent(userId ? readStored(userId, namespace) : []);
  }

  const addSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!userId || trimmed.length === 0) return;
      setRecent((previous) => {
        const next = [trimmed, ...previous.filter((entry) => entry.toLowerCase() !== trimmed.toLowerCase())].slice(
          0,
          MAX_RECENT,
        );
        window.localStorage.setItem(storageKey(userId, namespace), JSON.stringify(next));
        return next;
      });
    },
    [userId, namespace],
  );

  const clear = useCallback(() => {
    if (!userId) return;
    window.localStorage.removeItem(storageKey(userId, namespace));
    setRecent([]);
  }, [userId, namespace]);

  return { recent, addSearch, clear };
}
