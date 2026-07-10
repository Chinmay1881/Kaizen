"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { useDebounce } from "@/hooks/use-debounce";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import { MyIdeasSkeleton } from "@/features/kaizen/components/my-ideas/my-ideas-skeleton";
import type { KaizenSort } from "@/features/kaizen/types/kaizen";
import { ReviewQueueCard } from "@/features/review/components/queue/review-queue-card";
import { ReviewQueueFilters } from "@/features/review/components/queue/review-queue-filters";
import { useReviewQueue } from "@/features/review/hooks/use-review-queue";
import { ApiError } from "@/lib/api-client";
import type { KaizenPriority, KaizenStatus } from "@/types/enums";

const PAGE_SIZE = 10;
const COMPANY_WIDE_ROLES = ["HR", "CMD", "SUPER_ADMIN"];

export function ReviewQueueView() {
  const { data: currentUser } = useCurrentUser();
  const showDepartmentFilter = Boolean(
    currentUser && COMPANY_WIDE_ROLES.includes(currentUser.role),
  );

  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("");
  const [sort, setSort] = useState<KaizenSort>("newest");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchInput, 400);

  const query = useReviewQueue({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: (status as KaizenStatus) || undefined,
    departmentId: departmentId || undefined,
    categoryId: categoryId || undefined,
    priority: (priority as KaizenPriority) || undefined,
    sort,
  });

  function updateFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const hasActiveFilters = Boolean(
    debouncedSearch || status || departmentId || categoryId || priority,
  );

  if (query.isError) {
    const isForbidden = query.error instanceof ApiError && query.error.code === "FORBIDDEN";
    return (
      <ErrorState
        title={isForbidden ? "Access restricted" : "Couldn't load the review queue"}
        description={
          isForbidden
            ? "The Review Workspace is only available to department managers and above."
            : "Something went wrong while fetching the review queue. Please try again."
        }
        onRetry={isForbidden ? undefined : () => query.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ReviewQueueFilters
        search={searchInput}
        onSearchChange={updateFilter(setSearchInput)}
        status={status}
        onStatusChange={updateFilter(setStatus)}
        categoryId={categoryId}
        onCategoryChange={updateFilter(setCategoryId)}
        priority={priority}
        onPriorityChange={updateFilter(setPriority)}
        sort={sort}
        onSortChange={updateFilter(setSort)}
        showDepartmentFilter={showDepartmentFilter}
        departmentId={departmentId}
        onDepartmentChange={updateFilter(setDepartmentId)}
      />

      {query.isLoading || !query.data ? (
        <MyIdeasSkeleton />
      ) : query.data.items.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={ClipboardList}
            title="No Kaizens match your filters"
            description="Try adjusting your search or filters."
          />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="The review queue is empty"
            description="Nothing is waiting for your review right now."
          />
        )
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {query.data.items.map((kaizen) => (
              <ReviewQueueCard key={kaizen.id} kaizen={kaizen} />
            ))}
          </div>
          <MyIdeasPagination meta={query.data.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
