"use client";

import { SectionHeading } from "@/components/dashboard/section-heading";
import type { CurrentUser } from "@/features/auth/types/user";
import { useAnalyticsOverview, useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import { StudioAreaChart, StudioBarChart, StudioDonutChart } from "@/features/analytics/components/studio/studio-charts";
import { canViewCompanyAnalytics } from "@/lib/permissions";
import { formatCurrency } from "@/utils/format";

interface CompanyHealthSectionProps {
  user: CurrentUser;
  dateFrom: string;
  dateTo: string;
}

/**
 * Section 2 — full-width trend visualizations. The brief names "Approval trend" and
 * "Implementation trend" as literal time series, but no endpoint returns either (only
 * `monthlyKaizens`, `departmentSubmissions`, `statusDistribution`, `savingsTrend` exist on
 * `AnalyticsCharts`) — rather than fabricate two charts with invented numbers, this section uses
 * exactly those four real series: Submission Trend and Business Impact Trend match the brief
 * directly; Status Distribution and Department Submissions fill the other two slots honestly.
 */
export function CompanyHealthSection({ user, dateFrom, dateTo }: CompanyHealthSectionProps) {
  const isCompanyWide = canViewCompanyAnalytics(user.role);
  const range = { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
  const overviewQuery = useAnalyticsOverview(range, isCompanyWide);
  const departmentQuery = useDepartmentAnalytics(user.department?.id, !isCompanyWide);

  if (isCompanyWide) {
    const data = overviewQuery.data;
    return (
      <div className="flex flex-col gap-4">
        <SectionHeading title="Company Health" description="Submission, impact, and status trends company-wide" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <StudioAreaChart title="Submission Trend" description="Kaizens submitted per month" data={data?.charts.monthlyKaizens ?? []} isLoading={overviewQuery.isLoading} />
          <StudioAreaChart title="Business Impact Trend" description="Savings recorded per month" data={data?.charts.savingsTrend ?? []} color="var(--color-business-impact)" valueFormatter={formatCurrency} isLoading={overviewQuery.isLoading} />
          <StudioDonutChart title="Status Distribution" description="Where every Kaizen stands right now" data={data?.charts.statusDistribution ?? []} isLoading={overviewQuery.isLoading} />
          <StudioBarChart title="Department Submissions" description="Kaizens submitted per department" data={data?.charts.departmentSubmissions ?? []} color="var(--color-implementation)" isLoading={overviewQuery.isLoading} />
        </div>
      </div>
    );
  }

  const dept = departmentQuery.data?.[0];
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title={dept ? `${dept.departmentName} Health` : "Department Health"} description="Submission trend for your department" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StudioAreaChart title="Submission Trend" description="Kaizens created per month" data={dept?.monthlyTrend ?? []} isLoading={departmentQuery.isLoading} />
      </div>
    </div>
  );
}
