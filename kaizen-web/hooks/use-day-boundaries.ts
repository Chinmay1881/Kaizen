"use client";

import { useState } from "react";

/** Captures "today"/"yesterday" once via a lazy `useState` initializer (same SSR-safe pattern as
 * `mission-critical.tsx`'s `useState(() => Date.now())`) instead of computing `new Date()` fresh
 * on every render — used by every day-grouped timeline (`dayGroupLabel` in `utils/format.ts`). */
export function useDayBoundaries(): { today: Date; yesterday: Date } {
  const [boundaries] = useState(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return { today, yesterday };
  });
  return boundaries;
}
