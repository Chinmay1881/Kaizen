import PDFDocument from "pdfkit";

import type { ReportResult } from "../reports/report.types.js";
import { drawBarChart, drawLineChart, drawPieChart } from "./pdf-charts.js";

export interface PdfBuildContext {
  generatedByName: string;
  appliedFilters: Array<[string, string]>;
}

const MARGIN = 40;
const PAGE_WIDTH = 841.89; // A4 landscape
const PAGE_HEIGHT = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

/** Renders exactly the sections the Report Preview shows (Part 1: "Export exactly what the
 * preview displays") plus the PDF-specific header fields Part 2 asks for (logo placeholder,
 * generated-by, applied filters, page numbers) that have no on-screen equivalent. Landscape (Part
 * 2's "where appropriate") is used for every report type here, since every one includes a wide
 * KPI row and/or a multi-column table that benefits from the extra width. */
export function buildReportPdf(report: ReportResult, context: PdfBuildContext): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: MARGIN, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    renderHeader(doc, report, context);
    renderKpis(doc, report);
    if (report.comparison) renderComparison(doc, report.comparison);
    if (report.charts.length > 0) renderCharts(doc, report);
    if (report.table.rows.length > 0) renderTable(doc, report);
    renderTextSection(doc, "Executive Summary", report.summary);
    renderTextSection(doc, "Recommendations", report.recommendations);

    paginate(doc);
    doc.end();
  });
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage({ size: "A4", layout: "landscape", margin: MARGIN });
  }
}

function renderHeader(doc: PDFKit.PDFDocument, report: ReportResult, context: PdfBuildContext): void {
  // Company logo placeholder — no real logo asset exists anywhere in this codebase (see the
  // Reports module notes); a labeled box stands in for it rather than fabricating a brand mark.
  doc.rect(MARGIN, MARGIN, 48, 48).stroke("#cbd5e1");
  doc.fontSize(7).fillColor("#94a3b8").text("LOGO", MARGIN, MARGIN + 20, { width: 48, align: "center" });

  doc
    .fontSize(18)
    .fillColor("#0f172a")
    .text(report.title, MARGIN + 60, MARGIN, { width: CONTENT_WIDTH - 60 });
  doc
    .fontSize(10)
    .fillColor("#64748b")
    .text(`Generated ${new Date(report.generatedAt).toLocaleString("en-IN")} by ${context.generatedByName}`, MARGIN + 60, MARGIN + 26);
  if (report.dateFrom || report.dateTo) {
    const from = report.dateFrom ? new Date(report.dateFrom).toLocaleDateString("en-IN") : "…";
    const to = report.dateTo ? new Date(report.dateTo).toLocaleDateString("en-IN") : "…";
    doc.text(`Period: ${from} – ${to}`, MARGIN + 60, MARGIN + 40);
  }

  doc.y = MARGIN + 60;
  if (context.appliedFilters.length > 0) {
    doc.fontSize(9).fillColor("#334155");
    const filterLine = context.appliedFilters.map(([label, value]) => `${label}: ${value}`).join("   ·   ");
    doc.text(`Applied filters — ${filterLine}`, MARGIN, doc.y, { width: CONTENT_WIDTH });
  } else {
    doc.fontSize(9).fillColor("#94a3b8").text("Applied filters — none (all data in scope)", MARGIN, doc.y);
  }

  doc.moveDown(0.5);
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).strokeColor("#e2e8f0").stroke();
  doc.moveDown(0.75);
}

function renderKpis(doc: PDFKit.PDFDocument, report: ReportResult): void {
  ensureSpace(doc, 70);
  doc.fontSize(12).fillColor("#0f172a").text("Summary KPIs", MARGIN, doc.y);
  doc.moveDown(0.3);

  const perRow = 5;
  const cardWidth = CONTENT_WIDTH / perRow;
  const cardHeight = 46;
  const startY = doc.y;

  report.kpis.forEach((kpi, index) => {
    const col = index % perRow;
    const row = Math.floor(index / perRow);
    const x = MARGIN + col * cardWidth;
    const y = startY + row * (cardHeight + 6);
    doc.roundedRect(x, y, cardWidth - 6, cardHeight, 3).fillAndStroke("#f8fafc", "#e2e8f0");
    doc.fontSize(7).fillColor("#64748b").text(kpi.label, x + 8, y + 8, { width: cardWidth - 20 });
    doc.fontSize(13).fillColor("#0f172a").text(kpi.value, x + 8, y + 22, { width: cardWidth - 20 });
  });

  const rows = Math.ceil(report.kpis.length / perRow);
  doc.y = startY + rows * (cardHeight + 6) + 8;
}

function renderComparison(doc: PDFKit.PDFDocument, comparison: NonNullable<ReportResult["comparison"]>): void {
  ensureSpace(doc, 30 + comparison.metrics.length * 16);
  doc.fontSize(12).fillColor("#0f172a").text(`Comparison — ${comparison.periodLabel}`, MARGIN, doc.y);
  doc.moveDown(0.3);

  const colWidths = [200, 130, 130, 130, 130];
  const headers = ["Metric", "Current", "Previous", "Difference", "Change"];
  let x = MARGIN;
  doc.fontSize(8).fillColor("#64748b");
  headers.forEach((header, index) => {
    doc.text(header, x, doc.y, { width: colWidths[index], continued: index < headers.length - 1 });
    x += colWidths[index] ?? 0;
  });
  doc.moveDown(0.6);

  comparison.metrics.forEach((metric) => {
    const changeLabel =
      metric.percentChange === null
        ? "—"
        : `${metric.percentChange > 0 ? "+" : ""}${metric.percentChange}%${metric.percentChange >= 0 ? " growth" : " decline"}`;
    const rowY = doc.y;
    doc.fontSize(9).fillColor("#0f172a");
    doc.text(metric.label, MARGIN, rowY, { width: 200 });
    doc.text(String(metric.currentValue), MARGIN + 200, rowY, { width: 130 });
    doc.text(String(metric.previousValue), MARGIN + 330, rowY, { width: 130 });
    doc.text(
      `${metric.difference > 0 ? "+" : ""}${metric.difference}`,
      MARGIN + 460,
      rowY,
      { width: 130 },
    );
    doc.fillColor(metric.percentChange !== null && metric.percentChange < 0 ? "#dc2626" : "#16a34a");
    doc.text(changeLabel, MARGIN + 590, rowY, { width: 130 });
    doc.moveDown(0.5);
  });
  doc.fillColor("#0f172a");
  doc.moveDown(0.3);
}

function renderCharts(doc: PDFKit.PDFDocument, report: ReportResult): void {
  const chartHeight = 150;
  for (const chart of report.charts) {
    ensureSpace(doc, chartHeight + 30);
    doc.fontSize(11).fillColor("#0f172a").text(chart.title, MARGIN, doc.y);
    doc.moveDown(0.3);
    const rect = { x: MARGIN, y: doc.y, width: CONTENT_WIDTH, height: chartHeight };

    if (chart.type === "pie" || chart.type === "donut") {
      drawPieChart(doc, rect, chart.data, { donut: chart.type === "donut" });
    } else if (chart.type === "bar") {
      drawBarChart(doc, rect, chart.data);
    } else {
      drawLineChart(doc, rect, chart.data, { filled: chart.type === "area" });
    }

    doc.y = rect.y + chartHeight + 20;
  }
}

function renderTable(doc: PDFKit.PDFDocument, report: ReportResult): void {
  const PDF_ROW_CAP = 100;
  const rows = report.table.rows.slice(0, PDF_ROW_CAP);
  ensureSpace(doc, 40);
  doc.fontSize(12).fillColor("#0f172a").text("Detailed Table", MARGIN, doc.y);
  doc.moveDown(0.3);

  const columns = report.table.columns;
  const colWidth = CONTENT_WIDTH / columns.length;

  const renderHeaderRow = () => {
    let x = MARGIN;
    doc.fontSize(8).fillColor("#ffffff");
    doc.rect(MARGIN, doc.y, CONTENT_WIDTH, 18).fill("#334155");
    const headerY = doc.y - 18 + 5;
    columns.forEach((col) => {
      doc.fillColor("#ffffff").text(col.label, x + 4, headerY, { width: colWidth - 8, ellipsis: true });
      x += colWidth;
    });
    doc.y = headerY + 14;
  };

  renderHeaderRow();

  rows.forEach((row, rowIndex) => {
    ensureSpace(doc, 16);
    if (doc.y === MARGIN) renderHeaderRow();
    if (rowIndex % 2 === 1) {
      doc.rect(MARGIN, doc.y - 2, CONTENT_WIDTH, 14).fill("#f8fafc");
    }
    let x = MARGIN;
    doc.fontSize(8).fillColor("#334155");
    columns.forEach((col) => {
      doc.text(String(row[col.key] ?? "—"), x + 4, doc.y, { width: colWidth - 8, ellipsis: true });
      x += colWidth;
    });
    doc.moveDown(0.65);
  });

  if (report.table.rows.length > PDF_ROW_CAP) {
    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(`Showing the first ${PDF_ROW_CAP} of ${report.table.rows.length} rows — see the Excel or CSV export for the full dataset.`, MARGIN, doc.y + 4);
    doc.moveDown(0.5);
  }
  doc.moveDown(0.5);
}

function renderTextSection(doc: PDFKit.PDFDocument, title: string, lines: string[]): void {
  if (lines.length === 0) return;
  ensureSpace(doc, 30 + lines.length * 14);
  doc.fontSize(12).fillColor("#0f172a").text(title, MARGIN, doc.y);
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor("#334155");
  lines.forEach((line) => {
    ensureSpace(doc, 16);
    doc.text(`•  ${line}`, MARGIN, doc.y, { width: CONTENT_WIDTH });
    doc.moveDown(0.4);
  });
  doc.moveDown(0.4);
}

function paginate(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(`Page ${i - range.start + 1} of ${range.count}`, MARGIN, PAGE_HEIGHT - MARGIN + 10, {
        width: CONTENT_WIDTH,
        align: "center",
      });
  }
}
