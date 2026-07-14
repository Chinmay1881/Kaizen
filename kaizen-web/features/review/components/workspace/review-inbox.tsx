"use client";

import { useEffect, useRef } from "react";
import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import type { ReviewQueueItem } from "@/features/review/types/review";
import { ReviewInboxFilters, type ReviewInboxFilterValues } from "@/features/review/components/workspace/review-inbox-filters";
import { ReviewInboxRow } from "@/features/review/components/workspace/review-inbox-row";
import { SavedViewsBar } from "@/features/saved-views/components/saved-views-bar";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";
import { ApiError } from "@/lib/api-client";
import type { PaginationMeta } from "@/features/kaizen/types/kaizen";

interface ReviewInboxProps {
  values: ReviewInboxFilterValues;
  onChange: <K extends keyof ReviewInboxFilterValues>(key: K, value: string) => void;
  onApplySavedView: (filters: SavedViewFilters) => void;
  showDepartmentFilter: boolean;
  effectiveDepartmentId: string;
  activeFilters: SavedViewFilters;
  items: ReviewQueueItem[];
  meta: PaginationMeta | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function countAdvancedFilters(values: ReviewInboxFilterValues): number {
  return [
    values.dateFrom,
    values.dateTo,
    values.scoreMin,
    values.scoreMax,
    values.recommendation,
    values.submitterId,
    values.assignedReviewerId,
  ].filter(Boolean).length;
}

/** The Review Inbox — Linear-style issue list. Selecting a row never navigates; it just updates
 * `selectedId` on the workspace root, which re-renders the center/right panels in place. */
export function ReviewInbox({
  values,
  onChange,
  onApplySavedView,
  showDepartmentFilter,
  effectiveDepartmentId,
  activeFilters,
  items,
  meta,
  isLoading,
  isError,
  error,
  onRetry,
  onPageChange,
  selectedId,
  onSelect,
}: ReviewInboxProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId) return;
    const selectedRow = listRef.current?.querySelector<HTMLElement>(`[data-kaizen-id="${selectedId}"]`);
    selectedRow?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <div className="flex h-full flex-col">
      <ReviewInboxFilters
        values={values}
        onChange={onChange}
        showDepartmentFilter={showDepartmentFilter}
        effectiveDepartmentId={effectiveDepartmentId}
        activeAdvancedCount={countAdvancedFilters(values)}
      />

      <div className="border-b px-3 pb-3">
        <SavedViewsBar entityType="REVIEW_QUEUE" currentFilters={activeFilters} onApply={onApplySavedView} />
      </div>

      <div ref={listRef} role="listbox" aria-label="Review queue" className="flex-1 overflow-y-auto">
        {isError ? (
          <ErrorState
            title={error instanceof ApiError && error.code === "FORBIDDEN" ? "Access restricted" : "Couldn't load the queue"}
            description={
              error instanceof ApiError && error.code === "FORBIDDEN"
                ? "The Review Workspace is only available to department managers and above."
                : "Something went wrong. Please try again."
            }
            onRetry={error instanceof ApiError && error.code === "FORBIDDEN" ? undefined : onRetry}
            className="border-none"
          />
        ) : isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            {[...Array(6)].map((_, index) => (
              <LoadingSkeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={Object.keys(activeFilters).length > 0 ? "No matches" : "Queue is empty"}
            description={Object.keys(activeFilters).length > 0 ? "Try adjusting your filters." : "Nothing is waiting for review right now."}
            className="border-none px-4 py-10"
          />
        ) : (
          items.map((kaizen) => (
            <div key={kaizen.id} data-kaizen-id={kaizen.id}>
              <ReviewInboxRow kaizen={kaizen} isSelected={kaizen.id === selectedId} searchQuery={values.search} onSelect={() => onSelect(kaizen.id)} />
            </div>
          ))
        )}
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="border-t p-3">
          <MyIdeasPagination meta={meta} onPageChange={onPageChange} />
        </div>
      ) : null}
    </div>
  );
}
