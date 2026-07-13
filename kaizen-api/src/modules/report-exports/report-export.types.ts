import type { ReportExportFormat, ReportExportStatus, ReportType } from "@prisma/client";

export type { ReportExportFormat, ReportExportStatus };

export interface ReportExportItem {
  id: string;
  reportType: ReportType;
  format: ReportExportFormat;
  filters: Record<string, unknown>;
  status: ReportExportStatus;
  fileName: string;
  fileSizeBytes: number | null;
  errorMessage: string | null;
  expiresAt: string | null;
  generatedBy: { id: string; displayName: string };
  createdAt: string;
  reused: boolean;
}
