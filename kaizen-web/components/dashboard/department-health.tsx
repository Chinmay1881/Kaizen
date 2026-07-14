"use client";

import { Building2, Clock3, IndianRupee, PauseCircle } from "lucide-react";

import { SectionHeading } from "@/components/dashboard/section-heading";
import { Sparkline } from "@/components/charts/sparkline";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { ROUTES } from "@/constants/routes";
import { useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import type { DepartmentAnalyticsItem } from "@/features/analytics/types/analytics";
import type { CurrentUser } from "@/features/auth/types/user";
import { canViewCompanyAnalytics } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/utils/format";

interface DepartmentHealthProps {
  user: CurrentUser;
}

function heatClass(approvalRate: number): string {
  if (approvalRate >= 70) return "bg-success";
  if (approvalRate >= 50) return "text-warning-foreground bg-warning";
  return "bg-destructive";
}

function DepartmentCard({ dept }: { dept: DepartmentAnalyticsItem }) {
  return (
    <div className="interactive-lift flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <Building2 className="h-[18px] w-[18px]" />
          </span>
          <p className="truncate font-semibold">{dept.departmentName}</p>
        </div>
        <span data-metric className="text-lg font-semibold tabular-nums">
          {dept.approvalRate}%
        </span>
      </div>

      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-out", heatClass(dept.approvalRate))}
          style={{ width: `${Math.min(100, Math.max(0, dept.approvalRate))}%` }}
        />
      </div>

      <Sparkline data={dept.monthlyTrend.map((point) => point.value)} className="-mx-1" />

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock3 className="h-3 w-3" />
            Reviews
          </span>
          <span className="font-semibold">{formatNumber(dept.pendingReviews)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground flex items-center gap-1">
            <PauseCircle className="h-3 w-3" />
            Implementing
          </span>
          <span className="font-semibold">{formatNumber(dept.pendingImplementations)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground flex items-center gap-1">
            <IndianRupee className="h-3 w-3" />
            Savings
          </span>
          <span className="font-semibold">{formatCurrency(dept.actualSavings)}</span>
        </div>
      </div>
    </div>
  );
}

/** Only meaningful for reviewer roles — HR/CMD/Super Admin see every department (omitting
 * `departmentId` on `/analytics/departments` returns all active departments), a Department
 * Manager sees the one card for their own department. Not rendered for Employees. */
export function DepartmentHealth({ user }: DepartmentHealthProps) {
  const isCompanyWide = canViewCompanyAnalytics(user.role);
  const query = useDepartmentAnalytics(isCompanyWide ? undefined : user.department?.id, true);

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Department Health" description="Approval rate, backlog, and savings by department" action={{ label: "Full Analytics", href: ROUTES.ANALYTICS }} />
      {query.isLoading || !query.data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-[220px] w-full rounded-xl" />
          ))}
        </div>
      ) : query.data.length === 0 ? (
        <EmptyState icon={Building2} title="No department data" description="Department analytics will appear here once available." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.map((dept) => (
            <DepartmentCard key={dept.departmentId} dept={dept} />
          ))}
        </div>
      )}
    </div>
  );
}
