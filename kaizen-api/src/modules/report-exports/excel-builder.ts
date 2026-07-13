import ExcelJS from "exceljs";
import { PassThrough } from "node:stream";

import type { ReportResult } from "../reports/report.types.js";

export interface ExcelBuildContext {
  generatedByName: string;
  appliedFilters: Array<[string, string]>;
}

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
const HEADER_FONT: Partial<ExcelJS.Font> = { color: { argb: "FFFFFFFF" }, bold: true };

/** Approximates ExcelJS's missing auto-fit: widest of the header label or any cell's stringified
 * value in that column, plus padding — the standard workaround for a library with no native
 * column auto-sizing. */
function autoSizeColumns(sheet: ExcelJS.Worksheet, minWidth = 10, maxWidth = 60): void {
  sheet.columns.forEach((column) => {
    let widest = minWidth;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const length = String(cell.value ?? "").length;
      if (length + 2 > widest) widest = Math.min(length + 2, maxWidth);
    });
    column.width = widest;
  });
}

function buildSummarySheet(workbook: ExcelJS.stream.xlsx.WorkbookWriter, report: ReportResult, context: ExcelBuildContext): void {
  const sheet = workbook.addWorksheet("Summary", { views: [{ state: "frozen", ySplit: 1 }] });

  sheet.addRow([report.title]).font = { bold: true, size: 14 };
  sheet.addRow([`Generated ${new Date(report.generatedAt).toLocaleString("en-IN")} by ${context.generatedByName}`]);
  if (report.dateFrom || report.dateTo) {
    sheet.addRow([
      `Period: ${report.dateFrom ? new Date(report.dateFrom).toLocaleDateString("en-IN") : "…"} – ${report.dateTo ? new Date(report.dateTo).toLocaleDateString("en-IN") : "…"}`,
    ]);
  }
  sheet.addRow([
    context.appliedFilters.length > 0
      ? `Applied filters: ${context.appliedFilters.map(([label, value]) => `${label}=${value}`).join(", ")}`
      : "Applied filters: none",
  ]);
  sheet.addRow([]).commit();

  const kpiHeader = sheet.addRow(["KPI", "Value"]);
  kpiHeader.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
  kpiHeader.commit();
  report.kpis.forEach((kpi) => sheet.addRow([kpi.label, kpi.value]).commit());
  sheet.addRow([]).commit();

  if (report.comparison) {
    sheet.addRow([`Comparison — ${report.comparison.periodLabel}`]).font = { bold: true };
    const compHeader = sheet.addRow(["Metric", "Current", "Previous", "Difference", "% Change"]);
    compHeader.eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
    });
    compHeader.commit();
    report.comparison.metrics.forEach((metric) =>
      sheet
        .addRow([metric.label, metric.currentValue, metric.previousValue, metric.difference, metric.percentChange ?? "—"])
        .commit(),
    );
    sheet.addRow([]).commit();
  }

  sheet.addRow(["Executive Summary"]).font = { bold: true };
  report.summary.forEach((line) => sheet.addRow([line]).commit());
  sheet.addRow([]).commit();

  sheet.addRow(["Recommendations"]).font = { bold: true };
  report.recommendations.forEach((line) => sheet.addRow([line]).commit());

  sheet.getColumn(1).width = 55;
  sheet.getColumn(2).width = 20;
  sheet.commit();
}

function buildChartsDataSheet(workbook: ExcelJS.stream.xlsx.WorkbookWriter, report: ReportResult): void {
  const sheet = workbook.addWorksheet("Charts Data", { views: [{ state: "frozen", ySplit: 1 }] });
  const header = sheet.addRow(["Chart", "Type", "Label", "Value"]);
  header.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
  header.commit();

  for (const chart of report.charts) {
    for (const point of chart.data) {
      sheet.addRow([chart.title, chart.type, point.label, point.value]).commit();
    }
  }

  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 10;
  sheet.getColumn(3).width = 30;
  sheet.getColumn(4).width = 14;
  sheet.commit();
}

/** Named per report type per Part 3's own examples ("Business Impact", "Rewards") where the
 * report's detail table genuinely carries that data; every other report type gets a generic
 * "Detailed Rows" sheet name — no empty placeholder sheets are added for data a given report type
 * doesn't produce (see the Reports module notes for the full reasoning). */
function detailSheetName(reportType: ReportResult["reportType"]): string {
  if (reportType === "BUSINESS_IMPACT") return "Business Impact";
  if (reportType === "REWARD") return "Rewards";
  return "Detailed Rows";
}

function buildDetailSheet(workbook: ExcelJS.stream.xlsx.WorkbookWriter, report: ReportResult): void {
  if (report.table.columns.length === 0) return;
  const sheet = workbook.addWorksheet(detailSheetName(report.reportType), {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const header = sheet.addRow(report.table.columns.map((col) => col.label));
  header.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
  header.commit();

  // Rows are written incrementally through ExcelJS's own streaming workbook writer rather than
  // accumulated in a plain array first — the full filtered dataset (Part 4/10's "large datasets"),
  // not the live Preview's 100-row display cap (see `ReportService.buildFullReport`).
  for (const row of report.table.rows) {
    sheet.addRow(report.table.columns.map((col) => row[col.key] ?? "")).commit();
  }

  autoSizeColumns(sheet);
  sheet.commit();
}

export async function buildReportExcel(report: ReportResult, context: ExcelBuildContext): Promise<Buffer> {
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream, useStyles: true });
  workbook.creator = "Muliya Kaizan";
  workbook.created = new Date();

  buildSummarySheet(workbook, report, context);
  buildChartsDataSheet(workbook, report);
  buildDetailSheet(workbook, report);

  // `workbook.commit()` finalizes the internal zip archiver, which pipes into (and itself ends)
  // `stream` — do not call `stream.end()` here, it's already ended by the pipe.
  await workbook.commit();
  return done;
}
