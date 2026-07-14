"use client";

import { motion } from "framer-motion";
import { Award, Medal, Trophy } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { ROUTES } from "@/constants/routes";
import { fadeInUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useLeaderboard } from "@/features/gamification/hooks/use-leaderboard";
import { getInitialsFromName } from "@/utils/format";

const RANK_STYLE: Record<number, string> = {
  1: "bg-achievement/20 text-achievement-foreground ring-2 ring-achievement/40",
  2: "bg-muted-foreground/15 text-foreground ring-2 ring-muted-foreground/25",
  3: "bg-rewards/15 text-rewards ring-2 ring-rewards/30",
};

/** Rebuilt from scratch (Milestone 12 — Dashboard Reimagined). No historical rank-by-day data
 * exists in the API (the leaderboard is a live snapshot, not a time series), so rather than
 * fabricate "rank moved up 2" this animates rank order in on load — an honest "alive" motion
 * instead of an invented trend. */
export function LeaderboardSpotlight() {
  const { data, isLoading } = useLeaderboard({ period: "MONTHLY", scope: "COMPANY" });
  const rankings = data?.rankings.slice(0, 5) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Top Contributors" description="This month, company-wide" action={{ label: "Full leaderboard", href: ROUTES.LEADERBOARD }} />
      <div className="rounded-xl border bg-card p-3">
        {isLoading || !data ? (
          <div className="flex flex-col gap-2 p-2">
            {[...Array(5)].map((_, index) => (
              <LoadingSkeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <EmptyState icon={Trophy} title="No rankings yet" description="Points earned this month will show up here." />
        ) : (
          <ul className="flex flex-col">
            {rankings.map((entry, index) => (
              <motion.li
                key={entry.userId}
                initial="hidden"
                animate="visible"
                variants={fadeInUpVariants}
                transition={{ delay: index * 0.06 }}
                className="interactive-lift flex items-center gap-3 rounded-lg px-2 py-2.5"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    RANK_STYLE[entry.rank] ?? "text-muted-foreground bg-muted",
                  )}
                >
                  {entry.rank <= 3 ? <Medal className="h-4 w-4" /> : entry.rank}
                </span>
                <Avatar alt={entry.displayName} fallback={getInitialsFromName(entry.displayName)} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entry.displayName}</p>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    {entry.departmentName ? <span className="truncate">{entry.departmentName}</span> : null}
                    {entry.achievementCount > 0 ? (
                      <span className="flex items-center gap-0.5">
                        <Award className="h-3 w-3" />
                        {entry.achievementCount}
                      </span>
                    ) : null}
                  </div>
                </div>
                <span data-metric className="text-base font-semibold whitespace-nowrap">
                  {entry.totalPoints.toLocaleString("en-IN")}
                  <span className="text-muted-foreground ml-1 text-xs font-normal">pts</span>
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
