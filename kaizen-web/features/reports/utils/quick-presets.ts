function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface DatePreset {
  label: string;
  dateFrom: string;
  dateTo: string;
}

/** Plain client-side date arithmetic — no endpoint involved, every value is a real calendar date
 * computed from "now". */
export function getQuickPresets(): DatePreset[] {
  const now = new Date();
  const today = toISODate(now);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const last30 = new Date(now);
  last30.setDate(last30.getDate() - 30);

  return [
    { label: "This Month", dateFrom: toISODate(startOfMonth), dateTo: today },
    { label: "Last Month", dateFrom: toISODate(startOfLastMonth), dateTo: toISODate(endOfLastMonth) },
    { label: "This Quarter", dateFrom: toISODate(startOfQuarter), dateTo: today },
    { label: "This Year", dateFrom: toISODate(startOfYear), dateTo: today },
    { label: "Last 30 Days", dateFrom: toISODate(last30), dateTo: today },
  ];
}
