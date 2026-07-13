import type { ReportType } from "@prisma/client";

export interface ReportTemplateItem {
  id: string;
  name: string;
  reportType: ReportType;
  filters: Record<string, unknown>;
  chartsEnabled: boolean;
  columns: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
