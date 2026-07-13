import type { ReportBuilderFilters } from "@/features/reports/types/report";

export const FILTER_KEYS: Array<keyof ReportBuilderFilters> = [
  "dateFrom", "dateTo", "departmentId", "employeeId", "categoryId", "priority", "status",
  "reviewerId", "implementationOwnerId", "rewardStatus", "businessImpactStatus", "comparisonPeriod",
];

/** Part 11 — Dashboard Integration: "Generate Report" buttons on Analytics link here with query
 * params (`?reportType=...&departmentId=...`), which prefill the builder on first load. Also
 * reused by Report Templates' "Apply" action (Chunk 3B Part 7/8), so a saved template deep-links
 * into the builder exactly the same way a dashboard shortcut does — one query-param vocabulary,
 * not two. */
export function initialFiltersFromUrl(searchParams: URLSearchParams): ReportBuilderFilters {
  const filters: Record<string, string> = {
    reportType: searchParams.get("reportType") || "EXECUTIVE_SUMMARY",
  };
  for (const key of FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value) filters[key] = value;
  }
  return filters as unknown as ReportBuilderFilters;
}

export function filtersToSearchParams(reportType: string, filters: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams({ reportType });
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  return params;
}
