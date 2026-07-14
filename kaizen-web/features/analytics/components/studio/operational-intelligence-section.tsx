"use client";

import { AlertTriangle, Clock3, HardHat, Timer } from "lucide-react";

import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { SectionHeading } from "@/components/dashboard/section-heading";
import type { CurrentUser } from "@/features/auth/types/user";
import { useAnalyticsOverview, useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import type { StatusCounts } from "@/features/analytics/types/analytics";
import { FunnelChart } from "@/features/analytics/components/studio/funnel-chart";
import { canViewCompanyAnalytics } from "@/lib/permissions";
import { formatNumber } from "@/utils/format";

function buildPipeline(statusCounts: StatusCounts) {
  return [
    { label: "Submitted", value: statusCounts.submitted + statusCounts.underReview + statusCounts.approved + statusCounts.implementationPending + statusCounts.implementationComplete + statusCounts.businessImpactRecorded },
    { label: "Under Review", value: statusCounts.underReview + statusCounts.approved + statusCounts.implementationPending + statusCounts.implementationComplete + statusCounts.businessImpactRecorded },
    { label: "Approved", value: statusCounts.approved + statusCounts.implementationPending + statusCounts.implementationComplete + statusCounts.businessImpactRecorded },
    { label: "Implementing", value: statusCounts.implementationPending + statusCounts.implementationComplete + statusCounts.businessImpactRecorded },
    { label: "Completed", value: statusCounts.implementationComplete + statusCounts.businessImpactRecorded },
    { label: "Impact Recorded", value: statusCounts.businessImpactRecorded },
  ];
}

interface OperationalIntelligenceSectionProps {
  user: CurrentUser;
}

/** Section 5 — a real pipeline funnel built from cumulative `StatusCounts` (each stage includes
 * everything that has already passed through it, so the funnel narrows monotonically — the same
 * logic a real BI funnel uses), plus bottleneck/delay rankings from real `pendingReviews`/
 * `pendingImplementations` fields. `avgReviewTimeHours` only exists on the company-wide
 * `PerformanceMetrics` shape (not per-department), so it's shown only for HR/CMD/Super Admin. */
export function OperationalIntelligenceSection({ user }: OperationalIntelligenceSectionProps) {
  const isCompanyWide = canViewCompanyAnalytics(user.role);
  const overviewQuery = useAnalyticsOverview({}, isCompanyWide);
  const allDepartmentsQuery = useDepartmentAnalytics(undefined, isCompanyWide);
  const ownDepartmentQuery = useDepartmentAnalytics(user.department?.id, !isCompanyWide);

  const statusCounts = isCompanyWide ? overviewQuery.data?.statusCounts : ownDepartmentQuery.data?.[0]?.statusCounts;
  const isLoading = isCompanyWide ? overviewQuery.isLoading || !overviewQuery.data : ownDepartmentQuery.isLoading || !ownDepartmentQuery.data?.[0];
  const avgImplementationDays = isCompanyWide ? overviewQuery.data?.performance.avgImplementationTimeDays : ownDepartmentQuery.data?.[0]?.avgImplementationTimeDays;

  const bottleneckDepartments = [...(allDepartmentsQuery.data ?? [])].sort((a, b) => b.pendingReviews - a.pendingReviews).slice(0, 3);
  const delayedDepartments = [...(allDepartmentsQuery.data ?? [])].sort((a, b) => b.pendingImplementations - a.pendingImplementations).slice(0, 3);

  const implTotal = statusCounts ? statusCounts.implementationPending + statusCounts.implementationComplete : 0;
  const completionRate = implTotal > 0 ? Math.round((statusCounts!.implementationComplete / implTotal) * 100) : null;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Operational Intelligence" description="Where work is flowing smoothly, and where it's stuck" />

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 lg:col-span-2">
            <p className="text-sm font-semibold">Pipeline</p>
            <FunnelChart stages={buildPipeline(statusCounts!)} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <span className="bg-info/15 text-info flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <Clock3 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-muted-foreground text-xs">Avg. Review Time</p>
                <p className="text-lg font-semibold">{isCompanyWide && overviewQuery.data?.performance.avgReviewTimeHours != null ? `${overviewQuery.data.performance.avgReviewTimeHours}h` : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <span className="bg-warning/20 text-warning-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <Timer className="h-4 w-4" />
              </span>
              <div>
                <p className="text-muted-foreground text-xs">Avg. Implementation Time</p>
                <p className="text-lg font-semibold">{avgImplementationDays != null ? `${avgImplementationDays}d` : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <span className="bg-success/15 text-success flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <HardHat className="h-4 w-4" />
              </span>
              <div>
                <p className="text-muted-foreground text-xs">Completion Rate</p>
                <p className="text-lg font-semibold">{completionRate !== null ? `${completionRate}%` : "—"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCompanyWide && (bottleneckDepartments.length > 0 || delayedDepartments.length > 0) ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <AlertTriangle className="text-warning-foreground h-4 w-4" />
              Review Bottlenecks
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {bottleneckDepartments.map((dept) => (
                <li key={dept.departmentId} className="flex items-center justify-between">
                  <span className="truncate">{dept.departmentName}</span>
                  <span className="text-muted-foreground">{formatNumber(dept.pendingReviews)} pending</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <AlertTriangle className="text-destructive h-4 w-4" />
              Implementation Delays
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {delayedDepartments.map((dept) => (
                <li key={dept.departmentId} className="flex items-center justify-between">
                  <span className="truncate">{dept.departmentName}</span>
                  <span className="text-muted-foreground">{formatNumber(dept.pendingImplementations)} pending</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
