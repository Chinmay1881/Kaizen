"use client";

import { useEffect, useRef, useState } from "react";
import { HardHat } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import type { PaginationMeta } from "@/features/kaizen/types/kaizen";
import {
  ImplementationInboxFilters,
  type ImplementationInboxFilterValues,
} from "@/features/implementation/components/workspace/implementation-inbox-filters";
import { ImplementationInboxRow } from "@/features/implementation/components/workspace/implementation-inbox-row";
import type { Implementation } from "@/features/implementation/types/implementation";
import { getKanbanStage, type KanbanStage } from "@/features/implementation/utils/kanban-stage";
import { SavedViewsBar } from "@/features/saved-views/components/saved-views-bar";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";
import { ApiError } from "@/lib/api-client";

interface ImplementationInboxProps {
  values: ImplementationInboxFilterValues;
  onChange: <K extends keyof ImplementationInboxFilterValues>(key: K, value: string) => void;
  onApplySavedView: (filters: SavedViewFilters) => void;
  showDepartmentFilter: boolean;
  effectiveDepartmentId: string;
  activeFilters: SavedViewFilters;
  items: Implementation[];
  meta: PaginationMeta | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  selectedId: string | null;
  onSelect: (kaizenId: string) => void;
}

function countAdvancedFilters(values: ImplementationInboxFilterValues): number {
  return [values.dateFrom, values.dateTo, values.status, values.ownerId].filter(Boolean).length;
}

/** Left panel — a project-management-style queue. `search` and the Kanban stage chips filter
 * only the currently loaded page (see `ImplementationInboxFilters`'s doc comment for why). */
export function ImplementationInbox({
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
}: ImplementationInboxProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<KanbanStage | "">("");

  useEffect(() => {
    if (!selectedId) return;
    const selectedRow = listRef.current?.querySelector<HTMLElement>(`[data-kaizen-id="${selectedId}"]`);
    selectedRow?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  const visibleItems = items.filter((implementation) => {
    if (stage && getKanbanStage(implementation) !== stage) return false;
    if (!search.trim()) return true;
    const query = search.trim().toLowerCase();
    return implementation.kaizen.title.toLowerCase().includes(query) || implementation.kaizen.kaizenNumber.toLowerCase().includes(query);
  });
  const isFiltered = search.trim().length > 0 || stage !== "";

  return (
    <div className="flex h-full flex-col">
      <ImplementationInboxFilters
        search={search}
        onSearchChange={setSearch}
        stage={stage}
        onStageChange={setStage}
        values={values}
        onChange={onChange}
        showDepartmentFilter={showDepartmentFilter}
        effectiveDepartmentId={effectiveDepartmentId}
        activeAdvancedCount={countAdvancedFilters(values)}
      />

      <div className="border-b px-3 pb-3">
        <SavedViewsBar entityType="IMPLEMENTATION_QUEUE" currentFilters={activeFilters} onApply={onApplySavedView} />
      </div>

      <div ref={listRef} role="listbox" aria-label="Implementation queue" className="flex-1 overflow-y-auto">
        {isError ? (
          <ErrorState
            title="Couldn't load implementations"
            description={error instanceof ApiError ? error.message : "Something went wrong. Please try again."}
            onRetry={onRetry}
            className="border-none"
          />
        ) : isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            {[...Array(6)].map((_, index) => (
              <LoadingSkeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={HardHat}
            title={Object.keys(activeFilters).length > 0 ? "No matches" : "Nothing assigned yet"}
            description={Object.keys(activeFilters).length > 0 ? "Try adjusting your filters." : "Approved Kaizens you assign for implementation will show up here."}
            className="border-none px-4 py-10"
          />
        ) : visibleItems.length === 0 ? (
          <EmptyState icon={HardHat} title="No matches on this page" description="Your filter didn't match anything on the current page — try another page or clear it." className="border-none px-4 py-10" />
        ) : (
          <>
            {isFiltered ? (
              <p className="text-muted-foreground px-4 pt-3 text-xs">
                {visibleItems.length} of {items.length} on this page
              </p>
            ) : null}
            {visibleItems.map((implementation) => (
              <div key={implementation.id} data-kaizen-id={implementation.kaizenId}>
                <ImplementationInboxRow implementation={implementation} isSelected={implementation.kaizenId === selectedId} searchQuery={search} onSelect={() => onSelect(implementation.kaizenId)} />
              </div>
            ))}
          </>
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
