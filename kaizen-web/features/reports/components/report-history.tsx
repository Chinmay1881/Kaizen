"use client";

import { useState } from "react";
import { History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import { REPORT_TYPE_LABEL } from "@/features/reports/constants/report-types";
import { useReportHistory } from "@/features/reports/hooks/use-reports";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/utils/format";

const PAGE_SIZE = 10;

/** Report History (Part 10) — "history only, no downloads yet." Shows who generated which report,
 * with which filters, and how long it took (the same aggregation call the live preview uses, not
 * a separate file-generation step — there is no file yet, see Chunk 3B). */
export function ReportHistory() {
  const [page, setPage] = useState(1);
  const query = useReportHistory({ page, pageSize: PAGE_SIZE });

  if (query.isError) {
    const message =
      query.error instanceof ApiError ? query.error.message : "Something went wrong while fetching report history.";
    return <ErrorState title="Couldn't load report history" description={message} onRetry={() => query.refetch()} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Report History
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {query.isLoading || !query.data ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, index) => (
              <LoadingSkeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : query.data.items.length === 0 ? (
          <EmptyState icon={History} title="No reports generated yet" description="Generated reports will show up here." />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {query.data.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{REPORT_TYPE_LABEL[item.reportType]}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.generatedBy.displayName} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">{item.durationMs}ms</span>
                </div>
              ))}
            </div>
            <MyIdeasPagination meta={query.data.meta} onPageChange={setPage} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
