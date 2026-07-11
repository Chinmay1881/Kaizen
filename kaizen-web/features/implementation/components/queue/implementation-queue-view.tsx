"use client";

import { HardHat } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import { ImplementationQueueCard } from "@/features/implementation/components/queue/implementation-queue-card";
import { ImplementationQueueFilters } from "@/features/implementation/components/queue/implementation-queue-filters";
import { ImplementationQueueSkeleton } from "@/features/implementation/components/queue/implementation-queue-skeleton";
import { useImplementationList } from "@/features/implementation/hooks/use-implementation-list";
import type { VerificationStatus } from "@/features/implementation/types/implementation";
import { SavedViewsBar } from "@/features/saved-views/components/saved-views-bar";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";
import { ApiError } from "@/lib/api-client";

const PAGE_SIZE = 10;
const COMPANY_WIDE_ROLES = ["HR", "CMD", "SUPER_ADMIN"];

const DEFAULT_FILTERS = {
  status: "",
  departmentId: "",
  kaizenStatus: "",
  dateFrom: "",
  dateTo: "",
  page: "1",
};

export function ImplementationQueueView() {
  const { data: currentUser } = useCurrentUser();
  const showDepartmentFilter = Boolean(
    currentUser && COMPANY_WIDE_ROLES.includes(currentUser.role),
  );

  const { filters, setFilters, replaceAll } = useUrlFilters(DEFAULT_FILTERS);
  const page = Number(filters.page) || 1;

  const query = useImplementationList({
    page,
    pageSize: PAGE_SIZE,
    status: (filters.status as VerificationStatus) || undefined,
    departmentId: filters.departmentId || undefined,
    kaizenStatus: (filters.kaizenStatus as never) || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
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
    const message =
      query.error instanceof ApiError
        ? query.error.message
        : "Something went wrong while fetching implementations. Please try again.";
    return (
      <ErrorState
        title="Couldn't load implementations"
        description={message}
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SavedViewsBar
        entityType="IMPLEMENTATION_QUEUE"
        currentFilters={activeFilters}
        onApply={(saved) => replaceAll(saved as Partial<typeof DEFAULT_FILTERS>)}
      />

      <ImplementationQueueFilters
        status={filters.status}
        onStatusChange={updateFilter("status")}
        showDepartmentFilter={showDepartmentFilter}
        departmentId={filters.departmentId}
        onDepartmentChange={updateFilter("departmentId")}
        kaizenStatus={filters.kaizenStatus}
        onKaizenStatusChange={updateFilter("kaizenStatus")}
        dateFrom={filters.dateFrom}
        onDateFromChange={updateFilter("dateFrom")}
        dateTo={filters.dateTo}
        onDateToChange={updateFilter("dateTo")}
      />

      {query.isLoading || !query.data ? (
        <ImplementationQueueSkeleton />
      ) : query.data.items.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={HardHat}
            title="No implementations match your filters"
            description="Try adjusting your filters."
          />
        ) : (
          <EmptyState
            icon={HardHat}
            title="No implementations yet"
            description="Approved Kaizens you assign for implementation will show up here."
          />
        )
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {query.data.items.map((implementation) => (
              <ImplementationQueueCard key={implementation.id} implementation={implementation} />
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
