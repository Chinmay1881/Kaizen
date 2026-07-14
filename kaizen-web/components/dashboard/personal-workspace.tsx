"use client";

import Link from "next/link";
import { Award, Bell, Briefcase, Building2, Gift, Mail, Megaphone, Star, ThumbsUp } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/charts/sparkline";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { ROLE_LABELS } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { usePersonalAnalytics } from "@/features/analytics/hooks/use-analytics";
import type { CurrentUser } from "@/features/auth/types/user";
import { getAchievementIcon } from "@/features/gamification/constants/achievement-icons";
import { useUserAchievements } from "@/features/gamification/hooks/use-achievements";
import type { AchievementRarity } from "@/features/gamification/types/gamification";
import { useUnreadNotificationCount } from "@/features/notifications/hooks/use-notifications";
import { formatNumber, getInitials } from "@/utils/format";

interface PersonalWorkspaceProps {
  user: CurrentUser;
}

const RARITY_VARIANT: Record<AchievementRarity, "outline" | "info" | "warning" | "success"> = {
  COMMON: "outline",
  RARE: "info",
  EPIC: "warning",
  LEGENDARY: "success",
};

function ProfileCard({ user }: { user: CurrentUser }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <Avatar
          src={user.avatarUrl}
          alt={user.displayName}
          fallback={getInitials(user.firstName, user.lastName)}
          className="ring-border h-14 w-14 text-base ring-2 ring-offset-2 ring-offset-[var(--color-card)]"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.displayName}</p>
          <Badge variant="secondary" className="mt-1">
            {ROLE_LABELS[user.role]}
          </Badge>
        </div>
      </div>
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <span className="bg-muted flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
            <Mail className="text-muted-foreground h-3.5 w-3.5" />
          </span>
          <dt className="sr-only">Email</dt>
          <dd className="text-muted-foreground truncate">{user.email}</dd>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="bg-muted flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
            <Building2 className="text-muted-foreground h-3.5 w-3.5" />
          </span>
          <dt className="sr-only">Department</dt>
          <dd className="text-muted-foreground">{user.department?.name ?? "—"}</dd>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="bg-muted flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
            <Briefcase className="text-muted-foreground h-3.5 w-3.5" />
          </span>
          <dt className="sr-only">Job Title</dt>
          <dd className="text-muted-foreground">{user.jobTitle ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}

function MyAnalyticsCard() {
  const { data, isLoading } = usePersonalAnalytics();

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 lg:col-span-2">
      <p className="text-sm font-semibold">My Analytics</p>
      {isLoading || !data ? (
        <LoadingSkeleton className="h-24 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <ThumbsUp className="h-3 w-3" /> Approval Rate
              </span>
              <span data-metric className="text-xl font-semibold">
                {data.approvalRate}%
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Star className="h-3 w-3" /> Avg Score
              </span>
              <span data-metric className="text-xl font-semibold">
                {data.avgScore != null ? data.avgScore.toFixed(1) : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Award className="h-3 w-3" /> Achievements
              </span>
              <span data-metric className="text-xl font-semibold">
                {formatNumber(data.achievementsCount)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Gift className="h-3 w-3" /> Rewards
              </span>
              <span data-metric className="text-xl font-semibold">
                {formatNumber(data.rewardsTotal)} pts
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Monthly Activity</span>
              <Sparkline data={data.monthlyActivity.map((p) => p.value)} className="-mx-1" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Points Trend</span>
              <Sparkline data={data.pointsTrend.map((p) => p.value)} color="var(--color-rewards)" className="-mx-1" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AchievementsCard({ userId }: { userId: string }) {
  const { data, isLoading } = useUserAchievements(userId);
  const recent = [...(data ?? [])].sort((a, b) => b.earnedAt.localeCompare(a.earnedAt)).slice(0, 3);

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <p className="text-sm font-semibold">Recent Achievements</p>
      {isLoading ? (
        <LoadingSkeleton className="h-16 w-full" />
      ) : recent.length === 0 ? (
        <EmptyState icon={Award} title="None yet" description="Keep contributing to unlock your first one." className="border-none px-0 py-4" />
      ) : (
        <ul className="flex flex-col gap-3">
          {recent.map((entry) => {
            const Icon = getAchievementIcon(entry.achievement.icon);
            return (
              <li key={entry.id} className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.achievement.name}</p>
                </div>
                <Badge variant={RARITY_VARIANT[entry.achievement.rarity]}>{entry.achievement.rarity}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NotificationsCard() {
  const { data } = useUnreadNotificationCount();

  return (
    <Link href={ROUTES.NOTIFICATIONS} className="interactive-lift flex flex-col gap-3 rounded-xl border bg-card p-5">
      <p className="text-sm font-semibold">Notifications</p>
      <div className="flex items-center gap-3">
        <span className="bg-info/15 text-info flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Bell className="h-4 w-4" />
        </span>
        <div>
          <p data-metric className="text-xl font-semibold">
            {formatNumber(data?.count ?? 0)}
          </p>
          <p className="text-muted-foreground text-xs">unread</p>
        </div>
      </div>
    </Link>
  );
}

function AnnouncementsCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <p className="text-sm font-semibold">Announcements</p>
      <EmptyState icon={Megaphone} title="No announcements yet" description="Company-wide updates will be posted here." className="border-none px-0 py-4" />
    </div>
  );
}

/** Everything that's yours: profile, personal trend, achievements, unread notifications, and
 * announcements — the one section of the dashboard every role sees in the same shape. */
export function PersonalWorkspace({ user }: PersonalWorkspaceProps) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="My Workspace" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ProfileCard user={user} />
        <MyAnalyticsCard />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AchievementsCard userId={user.id} />
        <NotificationsCard />
        <AnnouncementsCard />
      </div>
    </div>
  );
}
