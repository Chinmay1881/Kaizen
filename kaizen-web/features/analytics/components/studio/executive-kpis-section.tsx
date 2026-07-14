"use client";

import { ClipboardCheck, HardHat, IndianRupee, Lightbulb } from "lucide-react";

import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import type { CurrentUser } from "@/features/auth/types/user";
import { useAnalyticsOverview, useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import { KpiCard, type KpiHealth } from "@/features/analytics/components/studio/kpi-card";
import { getPreviousPeriod, percentChange } from "@/features/analytics/utils/compare-period";
import { canViewCompanyAnalytics } from "@/lib/permissions";
import { formatCurrency } from "@/utils/format";

interface ExecutiveKpisSectionProps {
  user: CurrentUser;
  dateFrom: string;
  dateTo: string;
  compare: boolean;
  onDrillDown: (kpiLabel: string) => void;
}

function healthFromApproval(rate: number): KpiHealth {
  if (rate >= 70) return "good";
  if (rate >= 40) return "warning";
  return "critical";
}

/** Section 1 — large animated KPI cards. Comparison deltas only appear when a concrete date
 * range is set (`compare` is otherwise disabled in the filter bar) — fetches the exact same
 * `/analytics/overview` (or `/analytics/departments`) endpoint a second time with the previous
 * period's real dates, diffs client-side. */
export function ExecutiveKpisSection({ user, dateFrom, dateTo, compare, onDrillDown }: ExecutiveKpisSectionProps) {
  const isCompanyWide = canViewCompanyAnalytics(user.role);
  const range = { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
  const canCompare = compare && Boolean(dateFrom && dateTo);
  const previousRange = canCompare ? getPreviousPeriod(dateFrom, dateTo) : null;

  const overviewQuery = useAnalyticsOverview(range, isCompanyWide);
  const previousOverviewQuery = useAnalyticsOverview(previousRange ?? {}, isCompanyWide && canCompare);
  const departmentQuery = useDepartmentAnalytics(user.department?.id, !isCompanyWide);
  const previousDepartmentQuery = useDepartmentAnalytics(user.department?.id, !isCompanyWide && canCompare);

  const isLoading = isCompanyWide ? overviewQuery.isLoading || !overviewQuery.data : departmentQuery.isLoading || !departmentQuery.data?.[0];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  let approvalRate: number;
  let pendingReviews: number;
  let implementationProgress: number;
  let actualSavings: number;
  let previousApprovalRate: number | undefined;
  let previousActualSavings: number | undefined;
  let submissionSparkline: number[];

  if (isCompanyWide && overviewQuery.data) {
    const data = overviewQuery.data;
    approvalRate = data.performance.approvalRate;
    pendingReviews = data.statusCounts.submitted + data.statusCounts.underReview;
    const implTotal = data.statusCounts.implementationPending + data.statusCounts.implementationComplete;
    implementationProgress = implTotal > 0 ? Math.round((data.statusCounts.implementationComplete / implTotal) * 100) : 0;
    actualSavings = data.business.actualSavings;
    previousApprovalRate = previousOverviewQuery.data?.performance.approvalRate;
    previousActualSavings = previousOverviewQuery.data?.business.actualSavings;
    submissionSparkline = data.charts.monthlyKaizens.map((point) => point.value);
  } else {
    const dept = departmentQuery.data?.[0];
    approvalRate = dept?.approvalRate ?? 0;
    pendingReviews = dept?.pendingReviews ?? 0;
    const implTotal = (dept?.statusCounts.implementationPending ?? 0) + (dept?.statusCounts.implementationComplete ?? 0);
    implementationProgress = implTotal > 0 ? Math.round(((dept?.statusCounts.implementationComplete ?? 0) / implTotal) * 100) : 0;
    actualSavings = dept?.actualSavings ?? 0;
    previousApprovalRate = previousDepartmentQuery.data?.[0]?.approvalRate;
    previousActualSavings = previousDepartmentQuery.data?.[0]?.actualSavings;
    submissionSparkline = (dept?.monthlyTrend ?? []).map((point) => point.value);
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <button type="button" onClick={() => onDrillDown("Approval Rate")} className="text-left">
        <KpiCard
          label="Approval Rate"
          value={approvalRate}
          format={(v) => `${Math.round(v)}%`}
          icon={ClipboardCheck}
          health={healthFromApproval(approvalRate)}
          comparePercent={canCompare && previousApprovalRate !== undefined ? percentChange(approvalRate, previousApprovalRate) : undefined}
          sparklineData={submissionSparkline}
        />
      </button>
      <button type="button" onClick={() => onDrillDown("Pending Reviews")} className="text-left">
        <KpiCard label="Pending Reviews" value={pendingReviews} icon={Lightbulb} health={pendingReviews > 15 ? "critical" : pendingReviews > 5 ? "warning" : "good"} />
      </button>
      <button type="button" onClick={() => onDrillDown("Implementation Progress")} className="text-left">
        <KpiCard label="Implementation Progress" value={implementationProgress} format={(v) => `${Math.round(v)}%`} icon={HardHat} health={implementationProgress >= 60 ? "good" : implementationProgress >= 30 ? "warning" : "critical"} />
      </button>
      <button type="button" onClick={() => onDrillDown("Actual Savings")} className="text-left">
        <KpiCard
          label="Actual Savings"
          value={actualSavings}
          format={formatCurrency}
          icon={IndianRupee}
          health="good"
          comparePercent={canCompare && previousActualSavings !== undefined ? percentChange(actualSavings, previousActualSavings) : undefined}
        />
      </button>
    </div>
  );
}
