"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useLeaderboard } from "@/features/gamification/hooks/use-leaderboard";
import type {
  LeaderboardPeriod,
  LeaderboardScope,
} from "@/features/gamification/types/gamification";
import { formatNumber } from "@/utils/format";

const PERIOD_OPTIONS: Array<{ value: LeaderboardPeriod; label: string }> = [
  { value: "MONTHLY", label: "This Month" },
  { value: "QUARTERLY", label: "This Quarter" },
  { value: "YEARLY", label: "This Year" },
  { value: "ALL_TIME", label: "All Time" },
];

export function LeaderboardView() {
  const { data: currentUser } = useCurrentUser();
  const [period, setPeriod] = useState<LeaderboardPeriod>("MONTHLY");
  const [scope, setScope] = useState<LeaderboardScope>("COMPANY");

  const query = useLeaderboard({
    period,
    scope,
    departmentId: scope === "DEPARTMENT" ? currentUser?.department?.id : undefined,
  });

  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load the leaderboard"
        description="Something went wrong while fetching rankings. Please try again."
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Select
          className="w-auto"
          value={period}
          onChange={(event) => setPeriod(event.target.value as LeaderboardPeriod)}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto"
          value={scope}
          onChange={(event) => setScope(event.target.value as LeaderboardScope)}
        >
          <option value="COMPANY">Company-wide</option>
          <option value="DEPARTMENT" disabled={!currentUser?.department}>
            My Department
          </option>
        </Select>
      </div>

      {query.isLoading || !query.data ? (
        <div className="flex flex-col gap-2">
          {[...Array(6)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : query.data.rankings.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No rankings yet"
          description="Points earned this period will show up here."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {query.data.rankings.map((entry) => {
            const isCurrentUser = entry.userId === currentUser?.id;
            return (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-4",
                  isCurrentUser ? "bg-primary/5 border-primary/30" : "bg-background",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    entry.rank <= 3
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {entry.rank}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {entry.displayName} {isCurrentUser ? "(You)" : ""}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {entry.departmentName ?? "—"} &middot; {entry.ideasApproved} approved &middot;{" "}
                    {entry.achievementCount} achievements
                  </p>
                </div>
                <p className="text-lg font-bold tracking-tight">
                  {formatNumber(entry.totalPoints)} <span className="text-xs font-normal">pts</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
