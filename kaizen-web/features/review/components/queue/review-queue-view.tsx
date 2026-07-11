"use client";

import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import { MyIdeasSkeleton } from "@/features/kaizen/components/my-ideas/my-ideas-skeleton";
import type { KaizenSort } from "@/features/kaizen/types/kaizen";
import { ReviewQueueCard } from "@/features/review/components/queue/review-queue-card";
import { ReviewQueueFilters } from "@/features/review/components/queue/review-queue-filters";
import { useReviewQueue } from "@/features/review/hooks/use-review-queue";
import { SavedViewsBar } from "@/features/saved-views/components/saved-views-bar";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";
import { ApiError } from "@/lib/api-client";
import type { KaizenPriority, KaizenStatus } from "@/types/enums";

const PAGE_SIZE = 10;
const COMPANY_WIDE_ROLES = ["HR", "CMD", "SUPER_ADMIN"];

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  departmentId: "",
  categoryId: "",
  priority: "",
  sort: "newest",
  dateFrom: "",
  dateTo: "",
  scoreMin: "",
  scoreMax: "",
  recommendation: "",
  submitterId: "",
  assignedReviewerId: "",
  page: "1",
};

export function ReviewQueueView() {
  const { data: currentUser } = useCurrentUser();
  const showDepartmentFilter = Boolean(
    currentUser && COMPANY_WIDE_ROLES.includes(currentUser.role),
  );

  const { filters, setFilters, replaceAll } = useUrlFilters(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 400);
  const page = Number(filters.page) || 1;

  const effectiveDepartmentId = showDepartmentFilter
    ? filters.departmentId
    : (currentUser?.department?.id ?? "");

  const query = useReviewQueue({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: (filters.status as KaizenStatus) || undefined,
    departmentId: filters.departmentId || undefined,
    categoryId: filters.categoryId || undefined,
    priority: (filters.priority as KaizenPriority) || undefined,
    sort: filters.sort as KaizenSort,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    scoreMin: filters.scoreMin || undefined,
    scoreMax: filters.scoreMax || undefined,
    recommendation: filters.recommendation || undefined,
    submitterId: filters.submitterId || undefined,
    assignedReviewerId: filters.assignedReviewerId || undefined,
  });

  function updateFilter<K extends keyof typeof DEFAULT_FILTERS>(key: K) {
    return (value: string) => setFilters({ [key]: value } as Partial<typeof DEFAULT_FILTERS>);
  }

  const activeFilters: SavedViewFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([key, value]) => key !== "page" && value !== "" && value !== DEFAULT_FILTERS[key as keyof typeof DEFAULT_FILTERS],
    ),
  );

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

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
      <SavedViewsBar
        entityType="REVIEW_QUEUE"
        currentFilters={activeFilters}
        onApply={(saved) => replaceAll(saved as Partial<typeof DEFAULT_FILTERS>)}
      />

      <ReviewQueueFilters
        search={filters.search}
        onSearchChange={updateFilter("search")}
        status={filters.status}
        onStatusChange={updateFilter("status")}
        categoryId={filters.categoryId}
        onCategoryChange={updateFilter("categoryId")}
        priority={filters.priority}
        onPriorityChange={updateFilter("priority")}
        sort={filters.sort as KaizenSort}
        onSortChange={updateFilter("sort")}
        showDepartmentFilter={showDepartmentFilter}
        departmentId={filters.departmentId}
        onDepartmentChange={updateFilter("departmentId")}
        effectiveDepartmentId={effectiveDepartmentId}
        dateFrom={filters.dateFrom}
        onDateFromChange={updateFilter("dateFrom")}
        dateTo={filters.dateTo}
        onDateToChange={updateFilter("dateTo")}
        scoreMin={filters.scoreMin}
        onScoreMinChange={updateFilter("scoreMin")}
        scoreMax={filters.scoreMax}
        onScoreMaxChange={updateFilter("scoreMax")}
        recommendation={filters.recommendation}
        onRecommendationChange={updateFilter("recommendation")}
        submitterId={filters.submitterId}
        onSubmitterChange={updateFilter("submitterId")}
        assignedReviewerId={filters.assignedReviewerId}
        onAssignedReviewerChange={updateFilter("assignedReviewerId")}
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
          <MyIdeasPagination
            meta={query.data.meta}
            onPageChange={(nextPage) => setFilters({ page: String(nextPage) } as Partial<typeof DEFAULT_FILTERS>)}
          />
        </>
      )}
    </div>
  );
}
