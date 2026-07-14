"use client";

import { Award, CheckCircle2, Gift, IndianRupee, Lightbulb, Rocket, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { usePersonalAnalytics } from "@/features/analytics/hooks/use-analytics";
import type { CurrentUser } from "@/features/auth/types/user";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/utils/format";

interface PersonalInsightsPanelProps {
  user: CurrentUser;
}

function StatTile({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: React.ReactNode; tone: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border p-3">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p data-metric className="text-lg font-semibold">
          {value}
        </p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  );
}

const REWARD_NOTIFICATION_TYPES = new Set(["REWARD_ISSUED", "ACHIEVEMENT_UNLOCKED"]);

/** Right panel — Personal Insights. "Recent Rewards" reuses `useNotifications` filtered to
 * reward/achievement events client-side rather than a dedicated rewards-feed endpoint (none
 * exists) — the same notification stream the header bell and Dashboard activity feed already
 * read from. */
export function PersonalInsightsPanel({ user }: PersonalInsightsPanelProps) {
  const { data: personal, isLoading } = usePersonalAnalytics();
  const { data: notifications } = useNotifications({ page: 1, pageSize: 15 });

  const rewardNotifications = (notifications?.items ?? []).filter((notification) => REWARD_NOTIFICATION_TYPES.has(notification.type)).slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SectionHeading title="Quick Stats" />
        {isLoading || !personal ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, index) => (
              <LoadingSkeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <StatTile icon={Lightbulb} label="Submitted" value={formatNumber(user.gamification.ideasSubmitted)} tone="bg-info/15 text-info" />
            <StatTile icon={CheckCircle2} label="Approved" value={formatNumber(user.gamification.ideasApproved)} tone="bg-success/15 text-success" />
            <StatTile icon={XCircle} label="Rejected" value={formatNumber(personal.ideasRejected)} tone="bg-destructive/10 text-destructive" />
            <StatTile icon={Rocket} label="Implemented" value={formatNumber(user.gamification.ideasImplemented)} tone="bg-implementation/15 text-implementation" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t pt-6">
        <SectionHeading title="Business Impact" />
        {isLoading || !personal ? (
          <LoadingSkeleton className="h-16 w-full" />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <StatTile icon={IndianRupee} label="Actual Savings" value={formatCurrency(personal.actualBusinessImpact)} tone="bg-business-impact/15 text-business-impact" />
            <StatTile icon={Award} label="Ideas w/ Savings" value={formatNumber(personal.kaizensWithEstimatedSavings)} tone="bg-rewards/15 text-rewards" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t pt-6">
        <SectionHeading title="Recent Rewards" />
        {rewardNotifications.length === 0 ? (
          <EmptyState icon={Gift} title="None yet" description="Rewards and achievement unlocks will show up here." className="border-none px-0 py-4" />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {rewardNotifications.map((notification) => (
              <li key={notification.id} className="flex items-center gap-2.5">
                <span className="bg-rewards/15 text-rewards flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  <Gift className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{notification.title}</p>
                  <p className="text-muted-foreground text-xs">{formatRelativeTime(notification.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
