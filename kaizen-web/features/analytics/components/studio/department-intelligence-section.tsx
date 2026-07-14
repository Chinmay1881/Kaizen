"use client";

import { Building2 } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { Sparkline } from "@/components/charts/sparkline";
import type { CurrentUser } from "@/features/auth/types/user";
import type { DepartmentAnalyticsItem } from "@/features/analytics/types/analytics";
import { useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/utils/format";

function heatClass(approvalRate: number): string {
  if (approvalRate >= 70) return "bg-success";
  if (approvalRate >= 50) return "bg-warning";
  return "bg-destructive";
}

interface DepartmentIntelligenceSectionProps {
  user: CurrentUser;
  search: string;
  onDrillDown: (departmentId: string, departmentName: string) => void;
}

function RankedDepartmentCard({ dept, rank, onSelect }: { dept: DepartmentAnalyticsItem; rank: number; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="interactive-lift flex flex-col gap-4 rounded-2xl border bg-card p-5 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">{rank}</span>
          <p className="truncate font-semibold">{dept.departmentName}</p>
        </div>
        <span data-metric className="text-xl font-semibold tabular-nums">
          {dept.approvalRate}%
        </span>
      </div>

      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", heatClass(dept.approvalRate))} style={{ width: `${Math.min(100, Math.max(0, dept.approvalRate))}%` }} />
      </div>

      <Sparkline data={dept.monthlyTrend.map((point) => point.value)} className="-mx-1" />

      <div className="grid grid-cols-2 gap-3 border-t pt-3 text-xs">
        <div>
          <p className="text-muted-foreground">Pending Reviews</p>
          <p className="font-semibold">{formatNumber(dept.pendingReviews)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Actual Savings</p>
          <p className="font-semibold">{formatCurrency(dept.actualSavings)}</p>
        </div>
      </div>
    </button>
  );
}

/** Section 3 — ranked by approval rate (a real, comparable field every department has), heat bar
 * + sparkline + savings per card. Company-wide roles only — a Department Manager has just their
 * own department, which the Executive KPIs section already covers. Clicking a card opens the
 * drill-down drawer (Section 7). */
export function DepartmentIntelligenceSection({ user, search, onDrillDown }: DepartmentIntelligenceSectionProps) {
  const isCompanyWide = ["HR", "CMD", "SUPER_ADMIN"].includes(user.role);
  const query = useDepartmentAnalytics(undefined, isCompanyWide);

  if (!isCompanyWide) return null;

  const departments = [...(query.data ?? [])]
    .filter((dept) => dept.departmentName.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => b.approvalRate - a.approvalRate);

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Department Intelligence" description="Ranked by approval rate" />
      {query.isLoading || !query.data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState icon={Building2} title="No matches" description="No department matches your search." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept, index) => (
            <RankedDepartmentCard key={dept.departmentId} dept={dept} rank={index + 1} onSelect={() => onDrillDown(dept.departmentId, dept.departmentName)} />
          ))}
        </div>
      )}
    </div>
  );
}
