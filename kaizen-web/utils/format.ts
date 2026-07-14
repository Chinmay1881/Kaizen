export function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

/** A handful of chart/tooltip components still inline `₹${value.toLocaleString("en-IN")}` for a
 * one-off numeric label rather than a full currency line item — left as-is (Milestone 19 polish
 * pass), but any component displaying a currency *value* (not a tooltip number) should use this. */
export function formatCurrency(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/** "Chinmay Patel" -> "CP"; falls back to the first letter if only one name part exists. */
export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName?.trim().charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

/** Same as `getInitials`, for the common case of only having a single `displayName` string
 * (rather than separate first/last fields) — e.g. avatar fallbacks on a comment thread or
 * leaderboard row. */
export function getInitialsFromName(displayName: string): string {
  const [first, last] = displayName.trim().split(/\s+/, 2);
  return getInitials(first ?? "?", last);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const relativeFormatter = new Intl.RelativeTimeFormat("en-IN", { numeric: "auto" });

/** "3h ago" / "yesterday" / "2 weeks ago" — for the Review Inbox rows and Timeline, where a
 * precise timestamp is less useful at a glance than "how long ago." Falls back to "just now"
 * for anything under a minute. */
export function formatRelativeTime(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const seconds = (value.getTime() - Date.now()) / 1000;

  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return relativeFormatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return "just now";
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Today" / "Yesterday" / a formatted date — the day-bucket label used by every activity/download
 * timeline in the app (Dashboard, Admin Activity Log, Report Studio's Download Center). Callers
 * supply `today`/`yesterday` rather than this function computing them, so the boundary can be
 * captured once via a lazy `useState` initializer (see `hooks/use-day-boundaries.ts`) instead of
 * recomputed — and potentially SSR/client-mismatched — on every render. */
export function dayGroupLabel(date: Date, today: Date, yesterday: Date, options: { includeYear?: boolean } = {}): string {
  if (isSameCalendarDay(date, today)) return "Today";
  if (isSameCalendarDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-IN", options.includeYear ? { month: "long", day: "numeric", year: "numeric" } : { month: "long", day: "numeric" });
}
