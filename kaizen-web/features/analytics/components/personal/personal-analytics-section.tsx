"use client";

import { Award, Gift, Star, ThumbsUp, XCircle } from "lucide-react";

import { LineChartCard } from "@/components/charts/line-chart-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { StatCard } from "@/features/analytics/components/shared/stat-card";
import { usePersonalAnalytics } from "@/features/analytics/hooks/use-analytics";
import { ApiError } from "@/lib/api-client";
import { formatNumber } from "@/utils/format";

/** "Employee Profile Dashboard" (Milestone 11 Part 3) — `GET /analytics/personal` is
 * self-scoped and "Required" for any authenticated user, so this lives on the existing company
 * Dashboard (visible to every role, including Employees) rather than behind the Manager+-only
 * `/dashboard/analytics` page. Complements `StatsCards` (Milestone 3 — points/submitted/approved/
 * implemented/rank) rather than repeating it. */
export function PersonalAnalyticsSection() {
  const query = usePersonalAnalytics();

  if (query.isError) {
    const message =
      query.error instanceof ApiError
        ? query.error.message
        : "Something went wrong while fetching your analytics. Please try again.";
    return <ErrorState title="Couldn't load your analytics" description={message} onRetry={() => query.refetch()} />;
  }

  if (query.isLoading || !query.data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const data = query.data;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold tracking-tight">My Analytics</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={ThumbsUp} label="Approval Rate" value={`${data.approvalRate}%`} tone="success" />
        <StatCard icon={XCircle} label="Ideas Rejected" value={formatNumber(data.ideasRejected)} tone="destructive" />
        <StatCard icon={Star} label="Average Score" value={data.avgScore != null ? data.avgScore.toFixed(1) : "—"} />
        <StatCard icon={Award} label="Achievements" value={formatNumber(data.achievementsCount)} tone="warning" />
        <StatCard icon={Gift} label="Rewards" value={`${formatNumber(data.rewardsTotal)} pts`} tone="success" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LineChartCard title="Monthly Activity" description="Kaizens submitted per month" data={data.monthlyActivity} />
        <LineChartCard title="Score Trend" description="Average evaluation score per month" data={data.scoreTrend} />
        <LineChartCard title="Points Trend" description="Points earned per month" data={data.pointsTrend} />
      </div>
    </div>
  );
}
