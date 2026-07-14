"use client";

import { Flame, TrendingUp, Trophy } from "lucide-react";

import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { usePersonalAnalytics } from "@/features/analytics/hooks/use-analytics";
import type { CurrentUser } from "@/features/auth/types/user";
import { ContributionGraph } from "@/features/kaizen/components/workspace/contribution-graph";
import { getLevel, getLevelProgress } from "@/features/kaizen/utils/level-system";
import { getMonthlyStreak } from "@/features/kaizen/utils/streak";
import { useCountUp } from "@/hooks/use-count-up";
import { formatNumber } from "@/utils/format";

interface MyProgressSectionProps {
  user: CurrentUser;
}

/**
 * "Monthly Goal" / "Completion %" from the brief have no backing data — there's no goal-setting
 * feature anywhere in this app, so rather than invent a target number, this section shows the
 * real current-month submission count instead, alongside the Level bar and monthly streak
 * (both already summarized compactly on the profile card — this is the fuller treatment).
 */
export function MyProgressSection({ user }: MyProgressSectionProps) {
  const { data: personal, isLoading } = usePersonalAnalytics();
  const level = getLevel(user.gamification.totalPoints);
  const levelProgress = getLevelProgress(user.gamification.totalPoints);
  const animatedProgress = useCountUp(levelProgress, 800);
  const streak = personal ? getMonthlyStreak(personal.monthlyActivity) : 0;
  const thisMonth = personal?.monthlyActivity.at(-1)?.value ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="My Progress" />
      <div className="flex flex-col gap-6 rounded-2xl border bg-card p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Trophy className="text-achievement-foreground h-4 w-4" />
              Level {level.tier + 1} — {level.name}
            </span>
            <span data-metric className="text-sm font-medium tabular-nums">
              {Math.round(animatedProgress)}%
            </span>
          </div>
          <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
            <div className="bg-achievement h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${levelProgress}%` }} />
          </div>
        </div>

        {isLoading || !personal ? (
          <LoadingSkeleton className="h-24 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3">
              <div className="flex items-center gap-2.5">
                <span className="bg-info/15 text-info flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <div>
                  <p data-metric className="text-lg font-semibold">
                    {formatNumber(thisMonth)}
                  </p>
                  <p className="text-muted-foreground text-xs">This month</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="bg-warning/20 text-warning-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Flame className="h-4 w-4" />
                </span>
                <div>
                  <p data-metric className="text-lg font-semibold">
                    {streak > 0 ? `${streak} months` : "—"}
                  </p>
                  <p className="text-muted-foreground text-xs">Active streak</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Contribution History</p>
              <ContributionGraph monthlyActivity={personal.monthlyActivity} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
