"use client";

import { Award, Lock, Trophy } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { getAchievementIcon } from "@/features/gamification/constants/achievement-icons";
import { useAchievements, useUserAchievements } from "@/features/gamification/hooks/use-achievements";
import { useEmployeesAnalytics } from "@/features/analytics/hooks/use-analytics";
import { PERMISSION_CAPABILITIES } from "@/features/admin/constants/permissions-matrix";
import type { AdminUser } from "@/features/admin/types/admin";
import { hasMinimumRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { formatDate, getInitials } from "@/utils/format";

interface UserProfilePanelProps {
  user: AdminUser;
}

const ROLE_TONE: Record<AdminUser["role"], "outline" | "secondary" | "info" | "warning" | "achievement"> = {
  EMPLOYEE: "outline",
  DEPARTMENT_MANAGER: "secondary",
  HR: "info",
  CMD: "warning",
  SUPER_ADMIN: "achievement",
};

/**
 * Center panel. Statistics come from two already-fetched, already-existing endpoints rather than
 * new admin-specific ones: `useEmployeesAnalytics` (company leaderboard — gives rank + points if
 * this user has any) and `useUserAchievements` (their earned achievements). There is no endpoint
 * that returns an arbitrary user's own recent Kaizens to an admin — `GET /kaizens` is hardcoded to
 * `submitterId: requester.id` on the backend (always "my kaizens", regardless of role) — so that
 * sub-section from the brief is honestly left out rather than faked or misattributed.
 */
export function UserProfilePanel({ user }: UserProfilePanelProps) {
  const leaderboard = useEmployeesAnalytics();
  const achievements = useAchievements();
  const earned = useUserAchievements(user.id);

  const rankEntry = leaderboard.data?.find((entry) => entry.id === user.id);
  const earnedMap = new Map((earned.data ?? []).map((entry) => [entry.achievement.id, entry.earnedAt]));
  const capabilities = PERMISSION_CAPABILITIES.filter((capability) => hasMinimumRole(user.role, capability.minRole));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start gap-4">
        <Avatar alt={user.displayName} fallback={getInitials(user.firstName, user.lastName)} className="h-16 w-16 text-lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold tracking-tight">{user.displayName}</h2>
          <p className="text-muted-foreground truncate text-sm">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={ROLE_TONE[user.role]}>{user.role.replace("_", " ")}</Badge>
            <Badge variant={user.isActive ? "success" : "outline"}>{user.isActive ? "Active" : "Inactive"}</Badge>
            {user.department ? <Badge variant="outline">{user.department.name}</Badge> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-semibold tracking-tight">{rankEntry ? `#${rankEntry.rank}` : "—"}</p>
          <p className="text-muted-foreground text-xs">Company Rank</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-semibold tracking-tight">{rankEntry ? rankEntry.value : "—"}</p>
          <p className="text-muted-foreground text-xs">Points</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-semibold tracking-tight">{earnedMap.size}</p>
          <p className="text-muted-foreground text-xs">Achievements</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="text-achievement h-4 w-4" />
          <h3 className="text-sm font-semibold">Achievements</h3>
        </div>
        {achievements.isLoading || !achievements.data ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {[...Array(6)].map((_, index) => (
              <LoadingSkeleton key={index} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        ) : achievements.data.length === 0 ? (
          <p className="text-muted-foreground text-sm">No achievement definitions yet.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {achievements.data.map((achievement) => {
              const Icon = getAchievementIcon(achievement.icon);
              const earnedAt = earnedMap.get(achievement.id);
              const isEarned = Boolean(earnedAt);
              return (
                <div
                  key={achievement.id}
                  title={`${achievement.name}${isEarned ? ` — earned ${formatDate(earnedAt!)}` : " (not yet earned)"}`}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border text-center",
                    !isEarned && "opacity-40 grayscale",
                  )}
                >
                  {isEarned ? <Icon className="text-achievement h-4 w-4" /> : <Lock className="text-muted-foreground h-4 w-4" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Award className="text-primary h-4 w-4" />
          <h3 className="text-sm font-semibold">Permissions ({user.role.replace("_", " ")})</h3>
        </div>
        <ul className="flex flex-col gap-1.5">
          {capabilities.map((capability) => (
            <li key={capability.id} className="flex items-start gap-2 text-sm">
              <span className="bg-success mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden="true" />
              <span>{capability.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
