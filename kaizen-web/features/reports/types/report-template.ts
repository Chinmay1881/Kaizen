import type { ReportBuilderFilters } from "@/features/reports/types/report";

export interface ReportTemplateItem {
  id: string;
  name: string;
  reportType: ReportBuilderFilters["reportType"];
  filters: Record<string, unknown>;
  chartsEnabled: boolean;
  columns: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateTemplateInput = ReportBuilderFilters & {
  name: string;
  chartsEnabled?: boolean;
  columns?: string[];
};
