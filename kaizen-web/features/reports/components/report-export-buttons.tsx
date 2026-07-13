"use client";

import Link from "next/link";
import { FileSpreadsheet, FileText, Loader2, Table } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { toast } from "@/components/feedback/success-toast";
import { useCreateExport } from "@/features/reports/hooks/use-report-exports";
import type { ExportFormat } from "@/features/reports/types/report-export";
import type { ReportBuilderFilters } from "@/features/reports/types/report";
import { ApiError } from "@/lib/api-client";

interface ReportExportButtonsProps {
  filters: ReportBuilderFilters;
}

const FORMAT_META: Record<ExportFormat, { label: string; icon: typeof FileText }> = {
  PDF: { label: "PDF", icon: FileText },
  EXCEL: { label: "Excel", icon: FileSpreadsheet },
  CSV: { label: "CSV", icon: Table },
};

/** Part 1 — exports always use the currently selected filters (the same `filters` the Report
 * Builder just generated a Preview from), never a second, separately-edited filter state. Export
 * generation is async (Part 10); this only kicks the job off — actual download happens from the
 * Download Center once it completes. */
export function ReportExportButtons({ filters }: ReportExportButtonsProps) {
  const createExport = useCreateExport();

  function handleExport(format: ExportFormat) {
    createExport.mutate(
      { ...filters, format },
      {
        onSuccess: (result) => {
          toast.success(
            result.reused
              ? `Reused a recent matching ${FORMAT_META[format].label} export — see Download Center.`
              : `${FORMAT_META[format].label} export started — see Download Center for progress.`,
          );
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not start this export."),
      },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Export</span>
      {(Object.keys(FORMAT_META) as ExportFormat[]).map((format) => {
        const Icon = FORMAT_META[format].icon;
        return (
          <Button
            key={format}
            variant="outline"
            size="sm"
            onClick={() => handleExport(format)}
            disabled={createExport.isPending}
          >
            {createExport.isPending && createExport.variables?.format === format ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {FORMAT_META[format].label}
          </Button>
        );
      })}
      <Button variant="ghost" size="sm" asChild>
        <Link href={ROUTES.REPORTS_HISTORY}>Download Center</Link>
      </Button>
    </div>
  );
}
