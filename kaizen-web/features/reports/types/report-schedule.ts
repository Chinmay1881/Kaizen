import type { ReportBuilderFilters } from "@/features/reports/types/report";
import type { ExportFormat } from "@/features/reports/types/report-export";

export type ScheduleFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface ReportScheduleItem {
  id: string;
  reportType: ReportBuilderFilters["reportType"];
  format: ExportFormat;
  filters: Record<string, unknown>;
  frequency: ScheduleFrequency;
  recipientIds: string[];
  isEnabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  createdBy: { id: string; displayName: string };
  createdAt: string;
  updatedAt: string;
}

export type CreateScheduleInput = ReportBuilderFilters & {
  frequency: ScheduleFrequency;
  format: ExportFormat;
  recipientIds: string[];
  isEnabled?: boolean;
};

export type UpdateScheduleInput = Partial<CreateScheduleInput>;
