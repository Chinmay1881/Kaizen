"use client";

import { Gift, IndianRupee, Lightbulb, Rocket, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { useCountUp } from "@/hooks/use-count-up";
import type { CurrentUser } from "@/features/auth/types/user";
import { useAnalyticsOverview, useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import { canViewCompanyAnalytics } from "@/lib/permissions";
import { formatCurrency, formatNumber } from "@/utils/format";

function ValueTile({ icon: Icon, label, value, tone, hint }: { icon: LucideIcon; label: string; value: React.ReactNode; tone: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border p-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p data-metric className="text-2xl font-semibold tabular-nums">
        {value}
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
      {hint ? <p className="text-muted-foreground text-[11px]">{hint}</p> : null}
    </div>
  );
}

interface BusinessImpactSectionProps {
  user: CurrentUser;
  dateFrom: string;
  dateTo: string;
}

/**
 * Section 6. "Expected vs Actual" can't be a same-unit comparison — estimated savings is
 * recorded as free text at submission time, not a structured amount (see `PROJECT_STATUS.md`
 * Known Issues, and the old `BusinessMetrics` component's own comment), so the API only exposes
 * a *count* of Kaizens that estimated savings, never a summed expected total. Rather than
 * fabricate an expected total to divide against, this shows the real count alongside the real
 * actual-savings sum, each in its own honestly-labeled unit — no invented "ROI %".
 */
export function BusinessImpactSection({ user, dateFrom, dateTo }: BusinessImpactSectionProps) {
  const isCompanyWide = canViewCompanyAnalytics(user.role);
  const range = { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
  const overviewQuery = useAnalyticsOverview(range, isCompanyWide);
  const departmentQuery = useDepartmentAnalytics(user.department?.id, !isCompanyWide);

  const isLoading = isCompanyWide ? overviewQuery.isLoading || !overviewQuery.data : departmentQuery.isLoading || !departmentQuery.data?.[0];
  const actualSavings = isCompanyWide ? (overviewQuery.data?.business.actualSavings ?? 0) : (departmentQuery.data?.[0]?.actualSavings ?? 0);
  const animatedSavings = useCountUp(actualSavings);
  const implementedCount = isCompanyWide ? (overviewQuery.data?.statusCounts.implementationComplete ?? 0) : (departmentQuery.data?.[0]?.statusCounts.implementationComplete ?? 0);
  const kaizensWithSavings = isCompanyWide ? (overviewQuery.data?.business.kaizensWithEstimatedSavings ?? 0) : (departmentQuery.data?.[0]?.kaizensWithEstimatedSavings ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Business Impact" description="Real value created, in the company's own numbers" />
      {isLoading ? (
        <LoadingSkeleton className="h-48 w-full rounded-2xl" />
      ) : (
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex flex-col gap-1 border-b pb-6">
            <p className="text-muted-foreground text-sm font-medium">Actual Savings Recorded</p>
            <p data-metric className="text-5xl font-bold tracking-tight tabular-nums">
              {formatCurrency(animatedSavings)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-4">
            <ValueTile icon={Lightbulb} label="Ideas with Estimated Savings" value={formatNumber(kaizensWithSavings)} tone="bg-rewards/15 text-rewards" hint="Count, not a summed amount" />
            <ValueTile icon={Rocket} label="Ideas Implemented" value={formatNumber(implementedCount)} tone="bg-implementation/15 text-implementation" />
            {isCompanyWide ? (
              <>
                <ValueTile icon={Gift} label="Total Reward Points" value={formatNumber(overviewQuery.data?.business.totalRewardPoints ?? 0)} tone="bg-achievement/20 text-achievement-foreground" />
                <ValueTile icon={UserCheck} label="Employee Participation" value={`${overviewQuery.data?.business.employeeParticipationPercent ?? 0}%`} tone="bg-info/15 text-info" />
              </>
            ) : (
              <ValueTile icon={IndianRupee} label="Approval Rate" value={`${departmentQuery.data?.[0]?.approvalRate ?? 0}%`} tone="bg-success/15 text-success" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
