"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Copy, Download, FileSpreadsheet, FileText, Link2, Loader2, Pin, Sparkles, Star, Table, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/success-toast";
import { ROUTES } from "@/constants/routes";
import { useCreateExport, useReportExports } from "@/features/reports/hooks/use-report-exports";
import { useDeleteTemplate, useDuplicateTemplate, useToggleFavorite, useTogglePin } from "@/features/reports/hooks/use-report-templates";
import type { ExportFormat } from "@/features/reports/types/report-export";
import type { ReportBuilderFilters } from "@/features/reports/types/report";
import type { ReportTemplateItem } from "@/features/reports/types/report-template";
import { ScheduleFormDialog } from "@/features/reports/components/studio/schedule-form-dialog";
import { SaveTemplateDialog } from "@/features/reports/components/studio/save-template-dialog";
import { fadeInUpVariants } from "@/lib/motion";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const FORMAT_META: Record<ExportFormat, { label: string; icon: typeof FileText }> = {
  PDF: { label: "Export PDF", icon: FileText },
  EXCEL: { label: "Export Excel", icon: FileSpreadsheet },
  CSV: { label: "Export CSV", icon: Table },
};

interface ReportActionsPanelProps {
  filters: ReportBuilderFilters;
  onGenerate: () => void;
  isGenerating: boolean;
  appliedTemplate: ReportTemplateItem | null;
}

/**
 * Right panel — sticky. Export always uses the current builder filters (same discipline the old
 * `ReportExportButtons` documented). "Favorite"/"Pin"/"Duplicate"/"Delete" only appear once a
 * saved template is actually loaded (`appliedTemplate`) — those actions belong to a template
 * record, and showing them with nothing to act on would be a dead control. "Share" is a real
 * "copy link" (the current filters are already round-tripped through the URL query string, same
 * mechanism Templates' "Apply" already uses) rather than a fabricated sharing feature — no share
 * endpoint exists for a generated report.
 */
export function ReportActionsPanel({ filters, onGenerate, isGenerating, appliedTemplate }: ReportActionsPanelProps) {
  const createExport = useCreateExport();
  const exportsQuery = useReportExports({ page: 1, pageSize: 5 });
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [trackingFormat, setTrackingFormat] = useState<ExportFormat | null>(null);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const duplicateTemplate = useDuplicateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const toggleFavorite = useToggleFavorite();
  const togglePin = useTogglePin();

  const tracked = exportsQuery.data?.items.find((item) => item.id === trackingId);

  useEffect(() => {
    if (tracked?.status === "COMPLETED") {
      toast.success(`${trackingFormat ? FORMAT_META[trackingFormat].label : "Export"} ready — see Download Center.`);
    } else if (tracked?.status === "FAILED") {
      toast.error(tracked.errorMessage ?? "Export failed.");
    }
  }, [tracked?.status, trackingFormat, tracked?.errorMessage]);

  function handleExport(format: ExportFormat) {
    setTrackingFormat(format);
    createExport.mutate(
      { ...filters, format },
      {
        onSuccess: (result) => {
          setTrackingId(result.id);
          if (result.reused) toast.success(`Reused a recent matching ${FORMAT_META[format].label.replace("Export ", "")} export.`);
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : "Could not start this export.");
          setTrackingFormat(null);
        },
      },
    );
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(
      () => toast.success("Link copied — filters are included."),
      () => toast.error("Could not copy the link."),
    );
  }

  const isPreparing = tracked ? tracked.status === "PENDING" || tracked.status === "PROCESSING" : false;
  const isDone = tracked?.status === "COMPLETED";

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        <Button onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate
        </Button>

        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(FORMAT_META) as ExportFormat[]).map((format) => {
            const FormatIcon = FORMAT_META[format].icon;
            return (
              <Button key={format} variant="outline" onClick={() => handleExport(format)} disabled={createExport.isPending}>
                {createExport.isPending && createExport.variables?.format === format ? <Loader2 className="h-4 w-4 animate-spin" /> : <FormatIcon className="h-4 w-4" />}
                {FORMAT_META[format].label}
              </Button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {isPreparing ? (
            <motion.div key="preparing" initial="hidden" animate="visible" exit="hidden" variants={fadeInUpVariants} className="flex flex-col gap-2 rounded-lg border p-3">
              <p className="text-sm font-medium">Preparing report…</p>
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div className="bg-primary h-full w-1/3 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full" />
              </div>
            </motion.div>
          ) : isDone ? (
            <motion.div key="done" initial="hidden" animate="visible" exit="hidden" variants={fadeInUpVariants} className="flex items-center gap-2 rounded-lg border p-3">
              <CheckCircle2 className="text-success h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Export ready</p>
                <Link href={ROUTES.REPORTS_HISTORY} className="text-primary text-xs font-medium hover:underline">
                  Open Download Center →
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2 border-t py-4">
        <Button variant="ghost" className="justify-start" onClick={() => setScheduleOpen(true)}>
          <CalendarClock className="h-4 w-4" />
          Schedule
        </Button>
        <Button variant="ghost" className="justify-start" asChild>
          <Link href={ROUTES.REPORTS_TEMPLATES}>
            <FileText className="h-4 w-4" />
            Templates
          </Link>
        </Button>
        <Button variant="ghost" className="justify-start" onClick={handleCopyLink}>
          <Link2 className="h-4 w-4" />
          Share (Copy Link)
        </Button>
        <Button variant="ghost" className="justify-start" asChild>
          <Link href={ROUTES.REPORTS_HISTORY}>
            <Download className="h-4 w-4" />
            Download History
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t pt-4">
        {appliedTemplate ? (
          <>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{appliedTemplate.name}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFavorite.mutate({ id: appliedTemplate.id, value: !appliedTemplate.isFavorite })}
                className={cn(appliedTemplate.isFavorite && "border-warning text-warning-foreground")}
              >
                <Star className={cn("h-3.5 w-3.5", appliedTemplate.isFavorite && "fill-warning text-warning")} />
                Favorite
              </Button>
              <Button variant="outline" size="sm" onClick={() => togglePin.mutate({ id: appliedTemplate.id, value: !appliedTemplate.isPinned })} className={cn(appliedTemplate.isPinned && "border-primary text-primary")}>
                <Pin className={cn("h-3.5 w-3.5", appliedTemplate.isPinned && "fill-primary text-primary")} />
                Pin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  duplicateTemplate.mutate(appliedTemplate.id, {
                    onSuccess: () => toast.success("Template duplicated."),
                    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not duplicate this template."),
                  })
                }
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!window.confirm(`Delete template "${appliedTemplate.name}"?`)) return;
                  deleteTemplate.mutate(appliedTemplate.id, {
                    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not delete this template."),
                  });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </>
        ) : (
          <Button variant="outline" onClick={() => setSaveTemplateOpen(true)}>
            <Star className="h-4 w-4" />
            Save as Template
          </Button>
        )}
      </div>

      <SaveTemplateDialog filters={filters} open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen} />
      <ScheduleFormDialog open={scheduleOpen} onOpenChange={setScheduleOpen} initialReportType={filters.reportType} />
    </div>
  );
}
