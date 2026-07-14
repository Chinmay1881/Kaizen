"use client";

import { useCallback, useState } from "react";

const STORAGE_PREFIX = "kaizen:analytics-saved-views:";

export interface AnalyticsSavedView {
  id: string;
  name: string;
  filters: Record<string, string>;
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function readStored(userId: string): AnalyticsSavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AnalyticsSavedView[]) : [];
  } catch {
    return [];
  }
}

/**
 * `SavedViewEntityType` (the backend-synced Saved Views used by Review/Implementation/My
 * Ideas/Reports) has no `"ANALYTICS"` member — there's no server-side saved-view support for
 * this page. Rather than misuse an unrelated entity type or invent a backend change, this is a
 * deliberately separate, disclosed, browser-local equivalent (same `localStorage` pattern this
 * app already uses for recent searches) — it won't sync across devices, and it says so in the UI.
 */
export function useAnalyticsSavedViews(userId: string | undefined) {
  const [views, setViews] = useState<AnalyticsSavedView[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | undefined>(undefined);

  if (userId !== loadedFor) {
    setLoadedFor(userId);
    setViews(userId ? readStored(userId) : []);
  }

  const saveView = useCallback(
    (name: string, filters: Record<string, string>) => {
      if (!userId) return;
      setViews((previous) => {
        const next = [...previous, { id: crypto.randomUUID(), name, filters }];
        window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId],
  );

  const deleteView = useCallback(
    (id: string) => {
      if (!userId) return;
      setViews((previous) => {
        const next = previous.filter((view) => view.id !== id);
        window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId],
  );

  return { views, saveView, deleteView };
}
