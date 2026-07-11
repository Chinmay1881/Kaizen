"use client";

import { Building2 } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { DepartmentAnalyticsCard } from "@/features/analytics/components/department/department-analytics-card";
import { useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import { ApiError } from "@/lib/api-client";

export function DepartmentAnalyticsView() {
  const query = useDepartmentAnalytics();

  if (query.isError) {
    const message =
      query.error instanceof ApiError
        ? query.error.message
        : "Something went wrong while fetching department analytics. Please try again.";
    return (
      <ErrorState title="Couldn't load department analytics" description={message} onRetry={() => query.refetch()} />
    );
  }

  if (query.isLoading || !query.data) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(2)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-96 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (query.data.length === 0) {
    return <EmptyState icon={Building2} title="No department data" description="Nothing to show yet." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {query.data.map((department) => (
        <DepartmentAnalyticsCard key={department.departmentId} data={department} />
      ))}
    </div>
  );
}
