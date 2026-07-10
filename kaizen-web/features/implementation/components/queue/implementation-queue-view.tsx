"use client";

import { useState } from "react";
import { HardHat } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import { ImplementationQueueCard } from "@/features/implementation/components/queue/implementation-queue-card";
import { ImplementationQueueFilters } from "@/features/implementation/components/queue/implementation-queue-filters";
import { ImplementationQueueSkeleton } from "@/features/implementation/components/queue/implementation-queue-skeleton";
import { useImplementationList } from "@/features/implementation/hooks/use-implementation-list";
import type { VerificationStatus } from "@/features/implementation/types/implementation";
import { ApiError } from "@/lib/api-client";

const PAGE_SIZE = 10;
const COMPANY_WIDE_ROLES = ["HR", "CMD", "SUPER_ADMIN"];

export function ImplementationQueueView() {
  const { data: currentUser } = useCurrentUser();
  const showDepartmentFilter = Boolean(
    currentUser && COMPANY_WIDE_ROLES.includes(currentUser.role),
  );

  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [page, setPage] = useState(1);

  const query = useImplementationList({
    page,
    pageSize: PAGE_SIZE,
    status: (status as VerificationStatus) || undefined,
    departmentId: departmentId || undefined,
  });

  function updateFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const hasActiveFilters = Boolean(status || departmentId);

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
      <ImplementationQueueFilters
        status={status}
        onStatusChange={updateFilter(setStatus)}
        showDepartmentFilter={showDepartmentFilter}
        departmentId={departmentId}
        onDepartmentChange={updateFilter(setDepartmentId)}
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
          <MyIdeasPagination meta={query.data.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
