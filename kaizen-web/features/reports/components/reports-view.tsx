"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { ErrorState } from "@/components/feedback/error-state";
import { toast } from "@/components/feedback/success-toast";
import { ReportBuilder } from "@/features/reports/components/report-builder";
import { ReportExportButtons } from "@/features/reports/components/report-export-buttons";
import { ReportHistory } from "@/features/reports/components/report-history";
import { ReportPreview } from "@/features/reports/components/report-preview";
import { SaveTemplateButton } from "@/features/reports/components/save-template-button";
import { useGenerateReport } from "@/features/reports/hooks/use-reports";
import { initialFiltersFromUrl } from "@/features/reports/utils/report-url";
import type { ReportBuilderFilters } from "@/features/reports/types/report";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";
import { ApiError } from "@/lib/api-client";

export function ReportsView() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ReportBuilderFilters>(() => initialFiltersFromUrl(searchParams));
  const generateReport = useGenerateReport();

  function handleChange(updates: Partial<ReportBuilderFilters>) {
    setFilters((prev) => ({ ...prev, ...updates }));
  }

  function handleApplySavedView(saved: SavedViewFilters) {
    setFilters((prev) => ({ ...prev, ...(saved as Partial<ReportBuilderFilters>) }));
  }

  function handleGenerate() {
    generateReport.mutate(filters, {
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not generate this report."),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ReportBuilder
        filters={filters}
        onChange={handleChange}
        onApplySavedView={handleApplySavedView}
        onGenerate={handleGenerate}
        isGenerating={generateReport.isPending}
      />

      {generateReport.isError ? (
        <ErrorState
          title="Couldn't generate report"
          description={
            generateReport.error instanceof ApiError
              ? generateReport.error.message
              : "Something went wrong while generating the report. Please try again."
          }
          onRetry={handleGenerate}
        />
      ) : null}

      {generateReport.data ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ReportExportButtons filters={filters} />
            <SaveTemplateButton filters={filters} />
          </div>
          <ReportPreview report={generateReport.data} />
        </>
      ) : null}

      <ReportHistory />
    </div>
  );
}
