"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { Button } from "@/components/ui/button";
import { DashboardSection } from "@/components/v2/dashboard-section";
import { ProgressBar } from "@/components/v2/progress-bar";
import { WorkspaceCard } from "@/components/v2/workspace-card";
import { ROUTES } from "@/constants/routes";
import { usePersonalAnalytics } from "@/features/analytics/hooks/use-analytics";
import type { CurrentUser } from "@/features/auth/types/user";
import { getAchievementIcon } from "@/features/gamification/constants/achievement-icons";
import { useUserAchievements } from "@/features/gamification/hooks/use-achievements";
import { formatNumber, formatRelativeTime } from "@/utils/format";

interface PerformanceSectionProps {
  user: CurrentUser;
}

/** Answers Q4, "have I earned anything recently?" — points, approval rate, and the single latest
 * achievement, all from queries the dashboard already made (`user.gamification`,
 * `usePersonalAnalytics`, `useUserAchievements`). Replaces the old standalone "Recently Earned"
 * list-of-3 with a tighter sidebar-style panel: same data source, narrower display, matching the
 * finalized design's "Performance" panel. Two things it deliberately does NOT claim: there's no
 * "redeem rewards" flow in this app (the CTA goes to the real Leaderboard instead), and there's no
 * "Efficiency Score" metric — Approval Rate fills that slot since it's the real number closest to
 * what that bar is meant to communicate. */
export function PerformanceSection({ user }: PerformanceSectionProps) {
  const { data, isLoading } = usePersonalAnalytics();
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements(user.id);

  const latest = [...(achievements ?? [])].sort((a, b) => b.earnedAt.localeCompare(a.earnedAt))[0];

  return (
    <DashboardSection title="Performance">
      <WorkspaceCard className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Kaizen Points</p>
          <p className="text-achievement text-4xl font-bold tracking-tight">{formatNumber(user.gamification.totalPoints)}</p>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href={ROUTES.LEADERBOARD}>View Leaderboard</Link>
          </Button>
        </div>

        {isLoading || !data ? (
          <LoadingSkeleton className="h-8 w-full" />
        ) : (
          <ProgressBar label="Approval Rate" valueLabel={`${data.approvalRate}%`} value={data.approvalRate} tone="primary" />
        )}

        <div className="border-t pt-6">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">Latest Milestone</p>
          {achievementsLoading ? (
            <LoadingSkeleton className="h-16 w-full rounded-xl" />
          ) : latest ? (
            // `.map()` rather than resolving `getAchievementIcon` straight into a variable — the
            // same shape `achievements-grid.tsx`/`personal-workspace.tsx` already use, since a
            // dynamically-resolved JSX tag assigned outside a list-rendering callback trips
            // `react-hooks/static-components`.
            [latest].map((entry) => {
              const Icon = getAchievementIcon(entry.achievement.icon);
              return (
                <div key={entry.id} className="flex items-center gap-3">
                  <span className="bg-achievement/20 text-achievement-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{entry.achievement.name}</p>
                    <p className="text-muted-foreground text-xs">Earned {formatRelativeTime(entry.earnedAt)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center gap-3">
              <span className="bg-muted text-muted-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">No milestones yet</p>
                <p className="text-muted-foreground text-xs">Keep contributing to unlock your first one.</p>
              </div>
            </div>
          )}
        </div>
      </WorkspaceCard>
    </DashboardSection>
  );
}
