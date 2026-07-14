"use client";

import { AreaChartCard } from "@/components/charts/area-chart-card";
import { BarChartCard } from "@/components/charts/bar-chart-card";
import { LineChartCard } from "@/components/charts/line-chart-card";
import { PieChartCard } from "@/components/charts/pie-chart-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { ROUTES } from "@/constants/routes";
import { useAnalyticsOverview, useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import type { ChartPoint, StatusCounts } from "@/features/analytics/types/analytics";
import type { CurrentUser } from "@/features/auth/types/user";
import { canViewCompanyAnalytics } from "@/lib/permissions";
import { formatCurrency } from "@/utils/format";

interface BusinessHealthChartsProps {
  user: CurrentUser;
}

/** Same field-by-field mapping the backend's own `statusDistributionChart` uses (in
 * `analytics.service.ts`) — reshaping `StatusCounts` we already fetched into chart points,
 * client-side, rather than a second endpoint. */
function statusDistribution(statusCounts: StatusCounts): ChartPoint[] {
  return [
    { label: "Draft", value: statusCounts.draft },
    { label: "Submitted", value: statusCounts.submitted },
    { label: "Under Review", value: statusCounts.underReview },
    { label: "Needs Changes", value: statusCounts.needsChanges },
    { label: "Approved", value: statusCounts.approved },
    { label: "Rejected", value: statusCounts.rejected },
    { label: "Implementation Pending", value: statusCounts.implementationPending },
    { label: "Implementation Complete", value: statusCounts.implementationComplete },
    { label: "Business Impact Recorded", value: statusCounts.businessImpactRecorded },
    { label: "Reward Issued", value: statusCounts.rewardsIssued },
    { label: "Archived", value: statusCounts.archived },
    { label: "Published", value: statusCounts.publishedToKnowledgeBase },
  ].filter((point) => point.value > 0);
}

/** Only rendered for reviewer roles (see `DashboardView`) — an Employee has no `/analytics`
 * access on the backend, so this never fires that query for them. */
export function BusinessHealthCharts({ user }: BusinessHealthChartsProps) {
  const isCompanyWide = canViewCompanyAnalytics(user.role);
  const overviewQuery = useAnalyticsOverview({}, isCompanyWide);
  const departmentQuery = useDepartmentAnalytics(user.department?.id, !isCompanyWide);

  if (isCompanyWide) {
    if (overviewQuery.isLoading || !overviewQuery.data) {
      return (
        <div className="flex flex-col gap-4">
          <SectionHeading title="Business Health" description="Company-wide performance this period" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[...Array(4)].map((_, index) => (
              <LoadingSkeleton key={index} className="h-[340px] w-full rounded-xl" />
            ))}
          </div>
        </div>
      );
    }

    const data = overviewQuery.data;
    return (
      <div className="flex flex-col gap-4">
        <SectionHeading
          title="Business Health"
          description="Company-wide performance this period"
          action={{ label: "Full Analytics", href: ROUTES.ANALYTICS }}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AreaChartCard
            title="Savings Trend"
            description="Business impact recorded per month"
            data={data.charts.savingsTrend}
            valueFormatter={formatCurrency}
          />
          <LineChartCard title="Monthly Kaizens" description="Kaizens created per month" data={data.charts.monthlyKaizens} />
          <BarChartCard
            title="Department Submissions"
            description="Kaizens submitted per department"
            data={data.charts.departmentSubmissions}
          />
          <PieChartCard title="Status Distribution" description="Current status breakdown, company-wide" data={data.charts.statusDistribution} />
        </div>
      </div>
    );
  }

  const dept = departmentQuery.data?.[0];
  if (departmentQuery.isLoading || !dept) {
    return (
      <div className="flex flex-col gap-4">
        <SectionHeading title="Department Health" description="Your department's performance this period" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-[340px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading
        title={`${dept.departmentName} Health`}
        description="Your department's performance this period"
        action={{ label: "Full Analytics", href: ROUTES.ANALYTICS }}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineChartCard title="Monthly Kaizens" description="Kaizens created per month" data={dept.monthlyTrend} />
        <PieChartCard title="Status Distribution" description="Current status breakdown for your department" data={statusDistribution(dept.statusCounts)} />
      </div>
    </div>
  );
}
