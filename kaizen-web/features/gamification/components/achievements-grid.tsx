"use client";

import { Award } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { cn } from "@/lib/utils";
import { getAchievementIcon } from "@/features/gamification/constants/achievement-icons";
import { useAchievements, useUserAchievements } from "@/features/gamification/hooks/use-achievements";
import type { AchievementRarity } from "@/features/gamification/types/gamification";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { formatDate } from "@/utils/format";

const RARITY_VARIANT: Record<AchievementRarity, "outline" | "info" | "warning" | "success"> = {
  COMMON: "outline",
  RARE: "info",
  EPIC: "warning",
  LEGENDARY: "success",
};

export function AchievementsGrid() {
  const { data: currentUser } = useCurrentUser();
  const achievements = useAchievements();
  const earned = useUserAchievements(currentUser?.id);

  if (achievements.isError) {
    return (
      <ErrorState
        title="Couldn't load achievements"
        description="Something went wrong while fetching achievements. Please try again."
        onRetry={() => achievements.refetch()}
      />
    );
  }

  if (achievements.isLoading || !achievements.data) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (achievements.data.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No achievements yet"
        description="Achievement definitions will appear here once configured."
      />
    );
  }

  const earnedMap = new Map(
    (earned.data ?? []).map((entry) => [entry.achievement.id, entry.earnedAt]),
  );

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {achievements.data.map((achievement) => {
        const Icon = getAchievementIcon(achievement.icon);
        const earnedAt = earnedMap.get(achievement.id);
        const isEarned = Boolean(earnedAt);

        return (
          <Card key={achievement.id} className={cn(!isEarned && "opacity-50")}>
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  isEarned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold">{achievement.name}</p>
              <p className="text-muted-foreground text-xs">{achievement.description}</p>
              <Badge variant={RARITY_VARIANT[achievement.rarity]}>{achievement.rarity}</Badge>
              <p className="text-muted-foreground text-xs">
                {isEarned ? `Earned ${formatDate(earnedAt!)}` : `+${achievement.pointsAwarded} pts`}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
