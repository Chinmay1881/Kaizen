import type { ReportBuilderFilters } from "@/features/reports/types/report";

export type ExportFormat = "PDF" | "EXCEL" | "CSV";
export type ExportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ReportExportItem {
  id: string;
  reportType: ReportBuilderFilters["reportType"];
  format: ExportFormat;
  filters: Record<string, unknown>;
  status: ExportStatus;
  fileName: string;
  fileSizeBytes: number | null;
  errorMessage: string | null;
  expiresAt: string | null;
  generatedBy: { id: string; displayName: string };
  createdAt: string;
  reused: boolean;
}

export type CreateExportInput = ReportBuilderFilters & { format: ExportFormat };
