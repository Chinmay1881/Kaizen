"use client";

import { motion } from "framer-motion";
import { Lightbulb, Table2 } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useCountUp } from "@/hooks/use-count-up";
import { REPORT_TYPE_LABEL } from "@/features/reports/constants/report-types";
import { ReportPrintChart } from "@/features/reports/components/studio/report-print-charts";
import { ReportInsightsFeed } from "@/features/reports/components/studio/report-insights-feed";
import type { ReportResult } from "@/features/reports/types/report";
import { buildReportInsights } from "@/features/reports/utils/report-insights-engine";
import { fadeInUpVariants } from "@/lib/motion";
import { formatDate, formatNumber } from "@/utils/format";

function AnimatedKpi({ label, value }: { label: string; value: string }) {
  const numeric = Number(value.replace(/[^\d.-]/g, ""));
  const isPlainNumber = !Number.isNaN(numeric) && String(numeric) !== "" && /^-?[\d,]+(\.\d+)?%?$|^₹?[\d,]+(\.\d+)?$/.test(value.trim());
  const animated = useCountUp(isPlainNumber ? numeric : 0, 700);
  const prefix = value.trim().startsWith("₹") ? "₹" : "";
  const suffix = value.trim().endsWith("%") ? "%" : "";

  return (
    <div className="flex flex-col gap-1 rounded-xl border p-4">
      <p data-metric className="text-2xl font-bold tracking-tight tabular-nums">
        {isPlainNumber ? `${prefix}${formatNumber(Math.round(animated))}${suffix}` : value}
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

interface ReportPreviewDocumentProps {
  report: ReportResult | undefined;
  isLoading: boolean;
  isRegenerating: boolean;
}

/**
 * Center panel — the report rendered as close to its exported form as an HTML page reasonably
 * can: fixed page width, margins, a header/footer, section dividers. It's an on-screen
 * approximation, not a pixel-perfect PDF renderer — the real page breaks, exact typography, and
 * layout are whatever the existing PDFKit export engine produces server-side (untouched); this
 * preview exists so filters feel live before committing to an export.
 */
export function ReportPreviewDocument({ report, isLoading, isRegenerating }: ReportPreviewDocumentProps) {
  if (isLoading && !report) {
    return (
      <div className="mx-auto flex w-full max-w-[850px] flex-col gap-4 p-8">
        <LoadingSkeleton className="h-10 w-2/3" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-20 w-full" />
          ))}
        </div>
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) {
    return <EmptyState icon={Table2} title="No preview yet" description="Pick a report type and filters on the left to build a report." className="mx-auto max-w-md border-none py-24" />;
  }

  const insights = buildReportInsights(report);

  return (
    <div className="mx-auto w-full max-w-[850px] px-4 py-8 sm:px-8">
      <motion.article initial="hidden" animate="visible" variants={fadeInUpVariants} className="relative rounded-2xl border bg-white text-neutral-900 shadow-[var(--shadow-lg)] dark:bg-white dark:text-neutral-900">
        {isRegenerating ? (
          <div className="bg-primary absolute top-0 left-0 h-0.5 w-full overflow-hidden" aria-hidden="true">
            <div className="bg-primary-foreground/60 h-full w-1/3 animate-[shimmer_1s_ease-in-out_infinite]" />
          </div>
        ) : null}

        <div className="flex flex-col gap-8 p-10 sm:p-14">
          <header className="flex flex-col gap-2 border-b border-neutral-200 pb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Muliya Gold &amp; Jewellers LLP</span>
              <span className="text-xs text-neutral-500 uppercase">{REPORT_TYPE_LABEL[report.reportType]}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">{report.title}</h1>
            <p className="text-sm text-neutral-500">
              Generated {formatDate(report.generatedAt)}
              {report.dateFrom || report.dateTo ? ` · ${report.dateFrom ? formatDate(report.dateFrom) : "…"} – ${report.dateTo ? formatDate(report.dateTo) : "…"}` : ""}
            </p>
          </header>

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Executive Summary</h2>
            {report.summary.length > 0 ? (
              <ul className="flex flex-col gap-1.5 text-sm text-neutral-700">
                {report.summary.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">No summary available for this selection.</p>
            )}
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {report.kpis.map((kpi) => (
              <div key={kpi.label} className="text-neutral-900">
                <AnimatedKpi label={kpi.label} value={kpi.value} />
              </div>
            ))}
          </section>

          {/* This whole document intentionally forces a white/neutral "printed page" palette
              regardless of the app's own dark/light theme (it's simulating paper, not UI chrome),
              so fixed emerald/red accents are used here instead of the app's semantic
              success/destructive tokens — those are tuned for the UI theme, not guaranteed
              readable against a forced-white background. */}
          {report.comparison ? (
            <section className="flex flex-col gap-3 border-t border-neutral-200 pt-6">
              <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">{report.comparison.periodLabel}</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {report.comparison.metrics.map((metric) => (
                  <div key={metric.label} className="flex flex-col gap-0.5">
                    <p className="text-xs text-neutral-500">{metric.label}</p>
                    <p className="text-lg font-semibold">{formatNumber(metric.currentValue)}</p>
                    <p className={metric.difference > 0 ? "text-xs text-emerald-600" : metric.difference < 0 ? "text-xs text-red-600" : "text-xs text-neutral-500"}>
                      {metric.difference > 0 ? "+" : ""}
                      {formatNumber(metric.difference)}
                      {metric.percentChange !== null ? ` (${metric.percentChange > 0 ? "+" : ""}${metric.percentChange}%)` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {report.charts.length > 0 ? (
            <section className="grid grid-cols-1 gap-6 border-t border-neutral-200 pt-6 sm:grid-cols-2">
              {report.charts.map((chart) => (
                <ReportPrintChart key={chart.title} chart={chart} />
              ))}
            </section>
          ) : null}

          <section className="flex flex-col gap-3 border-t border-neutral-200 pt-6">
            <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">Detailed Table</h2>
            {report.table.columns.length === 0 ? (
              <p className="text-sm text-neutral-500">No table data for this report type.</p>
            ) : report.table.rows.length === 0 ? (
              <p className="text-sm text-neutral-500">Nothing matched the selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left">
                      {report.table.columns.map((column) => (
                        <th key={column.key} className="px-3 py-2 font-medium text-neutral-500">
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.table.rows.map((row, index) => (
                      <tr key={index} className="border-b border-neutral-100 last:border-0">
                        {report.table.columns.map((column) => (
                          <td key={column.key} className="px-3 py-2 tabular-nums">
                            {row[column.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {report.recommendations.length > 0 ? (
            <section className="flex flex-col gap-3 border-t border-neutral-200 pt-6">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                <Lightbulb className="h-3.5 w-3.5" />
                Recommendations
              </h2>
              <ul className="flex flex-col gap-1.5 text-sm text-neutral-700">
                {report.recommendations.map((line, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-neutral-400">•</span>
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="text-neutral-900">
            <ReportInsightsFeed insights={insights} />
          </div>

          <footer className="flex items-center justify-between border-t border-neutral-200 pt-4 text-xs text-neutral-400">
            <span>Muliya Kaizan — Confidential</span>
            <span>Page 1</span>
          </footer>
        </div>
      </motion.article>
    </div>
  );
}
