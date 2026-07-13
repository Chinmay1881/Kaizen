import type { ReportType } from "@prisma/client";

export type { ReportType };

export interface KpiCard {
  label: string;
  value: string;
}

export type ReportChartType = "line" | "bar" | "pie" | "area" | "donut";

export interface ReportChart {
  title: string;
  type: ReportChartType;
  data: Array<{ label: string; value: number }>;
}

export interface ComparisonMetric {
  label: string;
  currentValue: number;
  previousValue: number;
  difference: number;
  percentChange: number | null;
}

export interface ReportTableColumn {
  key: string;
  label: string;
}

export interface ReportResult {
  reportType: ReportType;
  title: string;
  generatedAt: string;
  dateFrom: string | null;
  dateTo: string | null;
  kpis: KpiCard[];
  charts: ReportChart[];
  table: { columns: ReportTableColumn[]; rows: Array<Record<string, string | number>> };
  summary: string[];
  recommendations: string[];
  comparison: { periodLabel: string; metrics: ComparisonMetric[] } | null;
}

export interface ReportHistoryItem {
  id: string;
  reportType: ReportType;
  filters: Record<string, unknown>;
  durationMs: number;
  generatedBy: { id: string; displayName: string };
  createdAt: string;
}
