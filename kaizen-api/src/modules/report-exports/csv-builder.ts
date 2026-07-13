import Papa from "papaparse";

import type { ReportResult } from "../reports/report.types.js";

export interface CsvBuildContext {
  generatedByName: string;
  appliedFilters: Array<[string, string]>;
}

/** Part 4 — "Current report table" is the primary payload; a short metadata preamble (title,
 * generated-by, applied filters) gives the CSV context on its own, matching the PDF/Excel headers.
 * PapaParse's `unparse` handles UTF-8-safe quoting/escaping for every cell (commas, quotes,
 * newlines in Kaizen titles); a leading BOM is prepended so Excel opens the file as UTF-8 rather
 * than guessing a legacy codepage. Part 10's "large datasets": the full filtered dataset is passed
 * in (see `ReportService.buildFullReport`), not the live Preview's 100-row cap. */
export function buildReportCsv(report: ReportResult, context: CsvBuildContext): Buffer {
  const rows: string[][] = [];

  rows.push([report.title]);
  rows.push([`Generated ${new Date(report.generatedAt).toLocaleString("en-IN")} by ${context.generatedByName}`]);
  if (report.dateFrom || report.dateTo) {
    rows.push([
      `Period: ${report.dateFrom ? new Date(report.dateFrom).toLocaleDateString("en-IN") : "…"} – ${report.dateTo ? new Date(report.dateTo).toLocaleDateString("en-IN") : "…"}`,
    ]);
  }
  rows.push([
    context.appliedFilters.length > 0
      ? `Applied filters: ${context.appliedFilters.map(([label, value]) => `${label}=${value}`).join(", ")}`
      : "Applied filters: none",
  ]);
  rows.push([]);

  rows.push(["KPI", "Value"]);
  report.kpis.forEach((kpi) => rows.push([kpi.label, kpi.value]));
  rows.push([]);

  if (report.comparison) {
    rows.push([`Comparison — ${report.comparison.periodLabel}`]);
    rows.push(["Metric", "Current", "Previous", "Difference", "% Change"]);
    report.comparison.metrics.forEach((metric) =>
      rows.push([
        metric.label,
        String(metric.currentValue),
        String(metric.previousValue),
        String(metric.difference),
        metric.percentChange !== null ? `${metric.percentChange}%` : "—",
      ]),
    );
    rows.push([]);
  }

  if (report.table.columns.length > 0) {
    rows.push(report.table.columns.map((col) => col.label));
    for (const row of report.table.rows) {
      rows.push(report.table.columns.map((col) => String(row[col.key] ?? "")));
    }
    rows.push([]);
  }

  rows.push(["Executive Summary"]);
  report.summary.forEach((line) => rows.push([line]));
  rows.push([]);

  rows.push(["Recommendations"]);
  report.recommendations.forEach((line) => rows.push([line]));

  const csv = Papa.unparse(rows);
  return Buffer.concat([Buffer.from("﻿", "utf-8"), Buffer.from(csv, "utf-8")]);
}
