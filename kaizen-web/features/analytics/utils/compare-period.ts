/** Equal-length period immediately preceding `[from, to]` — used for "Compare vs. previous
 * period" KPI deltas. Both periods are fetched from the same real `/analytics/overview` endpoint
 * with different real `dateFrom`/`dateTo` values; nothing here is estimated or fabricated. Only
 * meaningful once a concrete date range is selected — there's no sensible "previous period" for
 * an unbounded all-time query, so callers should only use this when both dates are set. */
export function getPreviousPeriod(dateFrom: string, dateTo: string): { dateFrom: string; dateTo: string } {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const spanMs = Math.max(0, to.getTime() - from.getTime());

  const previousTo = new Date(from.getTime() - 24 * 60 * 60 * 1000);
  const previousFrom = new Date(previousTo.getTime() - spanMs);

  return {
    dateFrom: previousFrom.toISOString().slice(0, 10),
    dateTo: previousTo.toISOString().slice(0, 10),
  };
}

/** `null` if `current` is 0 (avoids a nonsensical infinite/undefined percent) — the caller should
 * omit the trend arrow entirely in that case rather than show a fake 0%. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
