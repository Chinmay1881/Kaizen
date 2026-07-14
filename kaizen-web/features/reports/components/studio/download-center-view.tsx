"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, FileBarChart, FileSpreadsheet, FileText, Search, Table, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import { REPORT_TYPE_LABEL } from "@/features/reports/constants/report-types";
import { useDeleteExport, useDownloadExport, useReportExports } from "@/features/reports/hooks/use-report-exports";
import type { ExportFormat, ExportStatus } from "@/features/reports/types/report-export";
import { useDayBoundaries } from "@/hooks/use-day-boundaries";
import { fadeInUpVariants } from "@/lib/motion";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { dayGroupLabel, formatDate, formatRelativeTime } from "@/utils/format";

const PAGE_SIZE = 15;

const STATUS_VARIANT: Record<ExportStatus, "secondary" | "info" | "success" | "destructive"> = {
  PENDING: "secondary",
  PROCESSING: "info",
  COMPLETED: "success",
  FAILED: "destructive",
};

const FORMAT_ICON: Record<ExportFormat, typeof FileText> = { PDF: FileText, EXCEL: FileSpreadsheet, CSV: Table };

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Redesign of `ReportDownloadCenter` — timeline grouped by day instead of a flat list. "Search"
 * filters the currently loaded page client-side (`GET /reports/exports` has no search param).
 * No "Favorite" control — `ReportExportItem` has no `isFavorite` field and no toggle endpoint
 * (favoriting exists only on Templates); shown here would be a dead control, so it's omitted.
 */
export function DownloadCenterView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const query = useReportExports({ page, pageSize: PAGE_SIZE });
  const download = useDownloadExport();
  const remove = useDeleteExport();
  const { today, yesterday } = useDayBoundaries();

  function handleDownload(id: string, fileName: string) {
    download.mutate({ id, fileName }, { onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not download this export.") });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this export? This cannot be undone.")) return;
    remove.mutate(id, {
      onSuccess: () => toast.success("Export deleted."),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not delete this export."),
    });
  }

  if (query.isError) {
    return <ErrorState title="Couldn't load the Download Center" description={query.error instanceof ApiError ? query.error.message : "Something went wrong."} onRetry={() => query.refetch()} />;
  }

  const items = (query.data?.items ?? []).filter((item) => REPORT_TYPE_LABEL[item.reportType].toLowerCase().includes(search.trim().toLowerCase()));

  const rows = items.map((item, index) => {
    const date = new Date(item.createdAt);
    const group = dayGroupLabel(date, today, yesterday, { includeYear: true });
    const previousGroup = index > 0 ? dayGroupLabel(new Date(items[index - 1].createdAt), today, yesterday, { includeYear: true }) : null;
    return { item, group, showGroup: group !== previousGroup };
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Download Center</h1>
          <p className="text-muted-foreground text-sm">Every PDF, Excel, and CSV report you&apos;ve exported.</p>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter this page…" className="h-9 w-56 pl-9" aria-label="Filter downloads" />
        </div>
      </div>

      {query.isLoading || !query.data ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={FileBarChart} title={search ? "No matches" : "No exports yet"} description={search ? "Try a different search." : "Export a report as PDF, Excel, or CSV to see it here."} />
      ) : (
        <>
          <ol className="flex flex-col gap-1">
            {rows.map(({ item, group, showGroup }, index) => {
              const Icon = FORMAT_ICON[item.format];
              return (
                <motion.li key={item.id} initial="hidden" animate="visible" variants={fadeInUpVariants} transition={{ delay: Math.min(index, 10) * 0.03 }} className="flex flex-col gap-2">
                  {showGroup ? <p className="text-muted-foreground mt-3 mb-1 text-xs font-semibold tracking-wide uppercase first:mt-0">{group}</p> : null}
                  <div className={cn("flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between", item.id === highlightId && "border-primary bg-primary/5")}>
                    <div className="flex items-center gap-3">
                      <span className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{REPORT_TYPE_LABEL[item.reportType]}</p>
                          <Badge variant="outline">{item.format}</Badge>
                          <Badge variant={STATUS_VARIANT[item.status]}>{item.status}</Badge>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {item.generatedBy.displayName} · {formatRelativeTime(item.createdAt)} ({formatDate(item.createdAt)}) · {formatBytes(item.fileSizeBytes)}
                        </p>
                        {item.status === "FAILED" && item.errorMessage ? <p className="text-destructive text-xs">{item.errorMessage}</p> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button variant="outline" size="sm" disabled={item.status !== "COMPLETED" || download.isPending} onClick={() => handleDownload(item.id, item.fileName)}>
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete export" onClick={() => handleDelete(item.id)} disabled={remove.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
          <MyIdeasPagination meta={query.data.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
