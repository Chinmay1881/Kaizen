"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ReportActionsPanel } from "@/features/reports/components/studio/report-actions-panel";
import { ReportBuilderSidebar } from "@/features/reports/components/studio/report-builder-sidebar";
import { ReportPreviewDocument } from "@/features/reports/components/studio/report-preview-document";
import { useReportTemplates } from "@/features/reports/hooks/use-report-templates";
import { useGenerateReport } from "@/features/reports/hooks/use-reports";
import { initialFiltersFromUrl } from "@/features/reports/utils/report-url";
import type { ReportBuilderFilters } from "@/features/reports/types/report";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";

const DEBOUNCE_MS = 600;

/**
 * Milestone 17 — Report Studio. Three panels (Builder | Live Preview | Actions). `useGenerateReport`
 * is the exact same mutation the old page used on a manual "Generate" click — this just also
 * fires it automatically (debounced) whenever a filter changes, so the preview updates live
 * without a separate "Generate" screen; the button still exists for an instant manual re-run.
 */
export function ReportStudioView() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ReportBuilderFilters>(() => initialFiltersFromUrl(searchParams));
  const generateReport = useGenerateReport();
  const templatesQuery = useReportTemplates();
  const hasGeneratedOnce = useRef(false);
  const debounceRef = useRef<number | null>(null);

  const appliedTemplateId = searchParams.get("templateId");
  const appliedTemplate = appliedTemplateId ? (templatesQuery.data?.find((template) => template.id === appliedTemplateId) ?? null) : null;

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    const delay = hasGeneratedOnce.current ? DEBOUNCE_MS : 0;
    debounceRef.current = window.setTimeout(() => {
      hasGeneratedOnce.current = true;
      generateReport.mutate(filters);
    }, delay);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `generateReport` is a fresh mutation object every render; keying off `filters` alone is the intended "regenerate when filters change" trigger.
  }, [filters]);

  function handleChange(updates: Partial<ReportBuilderFilters>) {
    setFilters((prev) => ({ ...prev, ...updates }));
  }

  function handleApplySavedView(saved: SavedViewFilters) {
    setFilters((prev) => ({ ...prev, ...(saved as Partial<ReportBuilderFilters>) }));
  }

  function handleGenerate() {
    generateReport.mutate(filters);
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-xl border lg:grid lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_300px]">
      <aside className="flex h-64 flex-col overflow-hidden border-b lg:h-full lg:border-r xl:border-b-0">
        <ReportBuilderSidebar filters={filters} onChange={handleChange} onApplySavedView={handleApplySavedView} />
      </aside>

      <main className="flex-1 overflow-y-auto bg-neutral-100 dark:bg-neutral-900">
        <ReportPreviewDocument report={generateReport.data} isLoading={generateReport.isPending && !generateReport.data} isRegenerating={generateReport.isPending && Boolean(generateReport.data)} />
        <div className="border-t bg-neutral-100 p-4 dark:bg-neutral-900 xl:hidden">
          <ReportActionsPanel filters={filters} onGenerate={handleGenerate} isGenerating={generateReport.isPending} appliedTemplate={appliedTemplate} />
        </div>
      </main>

      <aside className="hidden overflow-hidden border-l xl:flex xl:flex-col">
        <ReportActionsPanel filters={filters} onGenerate={handleGenerate} isGenerating={generateReport.isPending} appliedTemplate={appliedTemplate} />
      </aside>
    </div>
  );
}
