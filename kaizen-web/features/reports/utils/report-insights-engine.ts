import type { ReportResult } from "@/features/reports/types/report";

export interface ReportInsight {
  id: string;
  tone: "positive" | "negative" | "neutral";
  text: string;
}

const RANKABLE_COLUMN_PATTERN = /savings|points|rate|score|impact/i;

/**
 * Deterministic, rule-based observations from the report already on screen — no AI, no second
 * backend call. Every rule only fires when the data it needs is actually present:
 *   - one line per `comparison.metrics` entry (already server-computed, real percentChange)
 *   - a "highest {column}" line only for table columns whose name suggests a rankable metric
 *     (savings/points/rate/score/impact), using the report's own first column as the row's label
 * Never invents a number that isn't already in `report.kpis`/`report.table`/`report.comparison`.
 */
export function buildReportInsights(report: ReportResult): ReportInsight[] {
  const insights: ReportInsight[] = [];

  if (report.comparison) {
    for (const metric of report.comparison.metrics) {
      if (metric.percentChange === null || metric.percentChange === 0) continue;
      insights.push({
        id: `compare-${metric.label}`,
        tone: metric.percentChange > 0 ? "positive" : "negative",
        text: `${metric.label} ${metric.percentChange > 0 ? "increased" : "decreased"} ${Math.abs(metric.percentChange)}% vs. ${report.comparison.periodLabel.toLowerCase()}.`,
      });
    }
  }

  if (report.table.columns.length > 1 && report.table.rows.length > 0) {
    const labelKey = report.table.columns[0].key;
    for (const column of report.table.columns.slice(1)) {
      if (!RANKABLE_COLUMN_PATTERN.test(column.label) && !RANKABLE_COLUMN_PATTERN.test(column.key)) continue;

      let topRow: Record<string, string | number> | null = null;
      for (const row of report.table.rows) {
        const value = row[column.key];
        if (typeof value !== "number") continue;
        if (!topRow || value > Number(topRow[column.key])) topRow = row;
      }
      if (!topRow) continue;
      const value = topRow[column.key];
      if (typeof value === "number" && value > 0) {
        insights.push({ id: `top-${column.key}`, tone: "positive", text: `${topRow[labelKey]} has the highest ${column.label.toLowerCase()}: ${value.toLocaleString("en-IN")}.` });
      }
    }
  }

  return insights.slice(0, 6);
}
