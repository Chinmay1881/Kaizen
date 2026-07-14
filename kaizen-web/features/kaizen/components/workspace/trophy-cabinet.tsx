"use client";

import { motion } from "framer-motion";
import { Award, Lock } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { getAchievementIcon } from "@/features/gamification/constants/achievement-icons";
import { useAchievements, useUserAchievements } from "@/features/gamification/hooks/use-achievements";
import type { AchievementRarity } from "@/features/gamification/types/gamification";
import { fadeInUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/format";

const RARITY_RING: Record<AchievementRarity, string> = {
  COMMON: "ring-muted-foreground/30",
  RARE: "ring-info/50",
  EPIC: "ring-warning/50",
  LEGENDARY: "ring-achievement/60",
};

const RARITY_GLOW: Record<AchievementRarity, string> = {
  COMMON: "bg-muted text-muted-foreground",
  RARE: "bg-info/15 text-info",
  EPIC: "bg-warning/20 text-warning-foreground",
  LEGENDARY: "bg-achievement/20 text-achievement-foreground",
};

/**
 * Employee-Workspace-exclusive rebuild of the achievement grid — the Leaderboard page's own
 * `AchievementsGrid` stays untouched (out of scope, not part of "My Ideas"). Same
 * `useAchievements`/`useUserAchievements` hooks, presented as a trophy cabinet: earned medallions
 * glow with their rarity color, locked ones sit greyed-out with a lock mark, both in one grid so
 * "what I have" and "what's next" read at a glance.
 */
export function TrophyCabinet() {
  const { data: currentUser } = useCurrentUser();
  const achievements = useAchievements();
  const earned = useUserAchievements(currentUser?.id);

  if (achievements.isError) {
    return <ErrorState title="Couldn't load achievements" description="Something went wrong. Please try again." onRetry={() => achievements.refetch()} />;
  }

  if (achievements.isLoading || !achievements.data) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {[...Array(8)].map((_, index) => (
          <LoadingSkeleton key={index} className="aspect-square w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (achievements.data.length === 0) {
    return <EmptyState icon={Award} title="No achievements yet" description="Achievement definitions will appear here once configured." className="border-none px-0 py-6" />;
  }

  const earnedMap = new Map((earned.data ?? []).map((entry) => [entry.achievement.id, entry.earnedAt]));
  const sorted = [...achievements.data].sort((a, b) => Number(earnedMap.has(b.id)) - Number(earnedMap.has(a.id)));

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {sorted.map((achievement, index) => {
        const Icon = getAchievementIcon(achievement.icon);
        const earnedAt = earnedMap.get(achievement.id);
        const isEarned = Boolean(earnedAt);

        return (
          <motion.div
            key={achievement.id}
            initial="hidden"
            animate="visible"
            variants={fadeInUpVariants}
            transition={{ delay: Math.min(index, 10) * 0.03 }}
            title={`${achievement.name} — ${achievement.description}${isEarned ? ` (earned ${formatDate(earnedAt!)})` : " (locked)"}`}
            className={cn(
              "group interactive-lift relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-transform duration-200 hover:scale-105",
              !isEarned && "opacity-50 grayscale",
            )}
          >
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-full ring-2", isEarned ? RARITY_GLOW[achievement.rarity] : "bg-muted text-muted-foreground", isEarned ? RARITY_RING[achievement.rarity] : "ring-transparent")}>
              {isEarned ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
            </span>
            <p className="line-clamp-2 text-[11px] leading-tight font-medium">{achievement.name}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
