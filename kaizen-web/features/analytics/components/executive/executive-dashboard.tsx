"use client";

import { useState } from "react";
import Link from "next/link";
import { FileBarChart } from "lucide-react";

import { AreaChartCard } from "@/components/charts/area-chart-card";
import { BarChartCard } from "@/components/charts/bar-chart-card";
import { LineChartCard } from "@/components/charts/line-chart-card";
import { PieChartCard } from "@/components/charts/pie-chart-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BusinessMetrics } from "@/features/analytics/components/executive/business-metrics";
import { LeaderboardPreview } from "@/features/analytics/components/executive/leaderboard-preview";
import { PerformanceMetrics } from "@/features/analytics/components/executive/performance-metrics";
import { StatusCards } from "@/features/analytics/components/executive/status-cards";
import { useAnalyticsOverview } from "@/features/analytics/hooks/use-analytics";
import { ApiError } from "@/lib/api-client";

export function ExecutiveDashboard() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const query = useAnalyticsOverview({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });

  if (query.isError) {
    const message =
      query.error instanceof ApiError
        ? query.error.message
        : "Something went wrong while fetching analytics. Please try again.";
    return <ErrorState title="Couldn't load analytics" description={message} onRetry={() => query.refetch()} />;
  }

  const reportHref = `/reports?reportType=EXECUTIVE_SUMMARY${dateFrom ? `&dateFrom=${dateFrom}` : ""}${dateTo ? `&dateTo=${dateTo}` : ""}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="analytics-date-from" className="text-xs">
              From
            </Label>
            <Input
              id="analytics-date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="analytics-date-to" className="text-xs">
              To
            </Label>
            <Input
              id="analytics-date-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="w-auto"
            />
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={reportHref}>
            <FileBarChart className="h-4 w-4" />
            Generate Report
          </Link>
        </Button>
      </div>

      {query.isLoading || !query.data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(10)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-tight">Overview</h3>
            <StatusCards statusCounts={query.data.statusCounts} />
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-tight">Performance</h3>
            <PerformanceMetrics performance={query.data.performance} />
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-tight">Business Impact</h3>
            <BusinessMetrics business={query.data.business} />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <LineChartCard title="Monthly Kaizens" description="Kaizens created per month" data={query.data.charts.monthlyKaizens} />
            <BarChartCard title="Department Submissions" description="Kaizens submitted per department" data={query.data.charts.departmentSubmissions} />
            <PieChartCard title="Status Distribution" description="Current status breakdown, company-wide" data={query.data.charts.statusDistribution} />
            <AreaChartCard
              title="Savings Trend"
              description="Business impact recorded per month"
              data={query.data.charts.savingsTrend}
              valueFormatter={(value) => `₹${value.toLocaleString("en-IN")}`}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-tight">Leaderboard Preview</h3>
            <LeaderboardPreview topEmployees={query.data.topEmployees} topDepartments={query.data.topDepartments} />
          </section>
        </>
      )}
    </div>
  );
}
