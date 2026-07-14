"use client";

import { Award, Flame, Medal, Trophy } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { ROLE_LABELS } from "@/constants/roles";
import type { CurrentUser } from "@/features/auth/types/user";
import { usePersonalAnalytics } from "@/features/analytics/hooks/use-analytics";
import { useLeaderboard } from "@/features/gamification/hooks/use-leaderboard";
import { getLevel, getLevelProgress } from "@/features/kaizen/utils/level-system";
import { getMonthlyStreak } from "@/features/kaizen/utils/streak";
import { useCountUp } from "@/hooks/use-count-up";
import { formatNumber, getInitials } from "@/utils/format";

interface PersonalProfileCardProps {
  user: CurrentUser;
}

function StatCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p data-metric className="text-lg font-semibold tabular-nums">
        {value}
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

/** Left panel hero. "Innovation Level" and "Current Streak" are disclosed derivations from real
 * fields (`totalPoints`, `monthlyActivity`) — see `level-system.ts`/`streak.ts` — not backend
 * concepts. "Leaderboard Position" (this month's live rank) is deliberately shown alongside
 * `gamification.currentRank` ("Current Rank") as a second, distinct real number rather than the
 * same value twice. */
export function PersonalProfileCard({ user }: PersonalProfileCardProps) {
  const { data: personal, isLoading } = usePersonalAnalytics();
  const { data: leaderboard } = useLeaderboard({ period: "MONTHLY", scope: "COMPANY" });

  const animatedPoints = useCountUp(user.gamification.totalPoints);
  const level = getLevel(user.gamification.totalPoints);
  const levelProgress = getLevelProgress(user.gamification.totalPoints);
  const myLeaderboardEntry = leaderboard?.rankings.find((entry) => entry.userId === user.id);
  const streak = personal ? getMonthlyStreak(personal.monthlyActivity) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at top left, color-mix(in oklch, var(--color-achievement) 10%, transparent), transparent 60%)" }}
      />
      <div className="relative flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Avatar
            src={user.avatarUrl}
            alt={user.displayName}
            fallback={getInitials(user.firstName, user.lastName)}
            className="ring-border h-16 w-16 text-lg ring-2 ring-offset-2 ring-offset-[var(--color-card)]"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{user.displayName}</p>
            <p className="text-muted-foreground truncate text-sm">{user.department?.name ?? "—"}</p>
            <Badge variant="secondary" className="mt-1">
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <Trophy className="text-achievement-foreground h-4 w-4" />
              {level.name}
            </span>
            <span className="text-muted-foreground text-xs">{level.nextThreshold !== null ? `${formatNumber(level.nextThreshold - user.gamification.totalPoints)} pts to next level` : "Max level"}</span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div className="bg-achievement h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${levelProgress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t pt-4">
          <StatCell label="Points" value={formatNumber(Math.round(animatedPoints))} />
          <StatCell label="Achievements" value={isLoading ? <LoadingSkeleton className="h-6 w-8" /> : formatNumber(personal?.achievementsCount ?? 0)} />
          <StatCell label="Rank" value={user.gamification.currentRank !== null ? `#${user.gamification.currentRank}` : "—"} />
        </div>

        <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
          <div className="flex items-center gap-2">
            <Medal className="text-rewards h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{myLeaderboardEntry ? `#${myLeaderboardEntry.rank}` : "Unranked"}</p>
              <p className="text-muted-foreground text-xs">This month</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="text-warning h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{streak > 0 ? `${streak} mo` : "—"}</p>
              <p className="text-muted-foreground text-xs">Active streak</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
          <Award className="h-3.5 w-3.5" />
          {level.nextThreshold !== null ? `${levelProgress}% of the way to ${getLevel(level.nextThreshold).name}` : "You've reached the highest level"}
        </div>
      </div>
    </div>
  );
}
