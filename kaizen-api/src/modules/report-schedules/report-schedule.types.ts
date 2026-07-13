import type { ReportExportFormat, ReportScheduleFrequency, ReportType } from "@prisma/client";

export type { ReportScheduleFrequency };

export interface ReportScheduleItem {
  id: string;
  reportType: ReportType;
  format: ReportExportFormat;
  filters: Record<string, unknown>;
  frequency: ReportScheduleFrequency;
  recipientIds: string[];
  isEnabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  createdBy: { id: string; displayName: string };
  createdAt: string;
  updatedAt: string;
}
