export type ReportType =
  | "EXECUTIVE_SUMMARY"
  | "MONTHLY"
  | "DEPARTMENT"
  | "EMPLOYEE_PERFORMANCE"
  | "KAIZEN_PERFORMANCE"
  | "REVIEW_PERFORMANCE"
  | "IMPLEMENTATION"
  | "BUSINESS_IMPACT"
  | "REWARD"
  | "LEADERBOARD";

export type ComparisonPeriod = "NONE" | "MONTH" | "QUARTER" | "YEAR";

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

export interface ReportBuilderFilters {
  reportType: ReportType;
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  employeeId?: string;
  categoryId?: string;
  priority?: string;
  status?: string;
  reviewerId?: string;
  implementationOwnerId?: string;
  rewardStatus?: string;
  businessImpactStatus?: string;
  comparisonPeriod?: ComparisonPeriod;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
