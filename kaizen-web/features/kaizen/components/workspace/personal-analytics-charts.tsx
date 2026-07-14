"use client";

import { Star, ThumbsUp } from "lucide-react";

import { LineChartCard } from "@/components/charts/line-chart-card";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StatCard } from "@/features/analytics/components/shared/stat-card";
import { usePersonalAnalytics } from "@/features/analytics/hooks/use-analytics";

/** Full-width charts, reusing the exact same `usePersonalAnalytics` query every other section on
 * this page already fetches (React Query dedupes it — no extra request) and the same
 * `LineChartCard`/`StatCard` primitives used across Dashboard/Analytics, rather than a new chart
 * design. */
export function PersonalAnalyticsCharts() {
  const { data, isLoading } = usePersonalAnalytics();

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Personal Analytics" description="How your ideas have performed over time" />
      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-[300px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={ThumbsUp} label="Approval Rate" value={`${data.approvalRate}%`} tone="success" />
            <StatCard icon={Star} label="Average Score" value={data.avgScore != null ? data.avgScore.toFixed(1) : "—"} tone="info" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <LineChartCard title="Score Trend" description="Average evaluation score per month" data={data.scoreTrend} />
            <LineChartCard title="Points Trend" description="Points earned per month" data={data.pointsTrend} />
          </div>
        </>
      )}
    </div>
  );
}
