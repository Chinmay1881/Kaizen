"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { History, Trophy } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { useDayBoundaries } from "@/hooks/use-day-boundaries";
import { fadeInUpVariants } from "@/lib/motion";
import { TONE_DOT_CLASS } from "@/lib/tone-classes";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import { getNotificationTone, NOTIFICATION_TYPE_ICON } from "@/features/notifications/utils/notification-icon";
import { dayGroupLabel } from "@/utils/format";

/** Rebuilt from scratch (Milestone 12 — Dashboard Reimagined): grouped by real day boundaries
 * (Today/Yesterday/date), not just a flat list — same `useNotifications` data every prior version
 * of this card used, just visualized with the day structure a human actually reads activity in. */
export function ActivityTimeline() {
  const { data, isLoading } = useNotifications({ page: 1, pageSize: 8 });
  const { today, yesterday } = useDayBoundaries();

  const items = data?.items ?? [];
  const groupedItems = items.map((notification, index) => {
    const group = dayGroupLabel(new Date(notification.createdAt), today, yesterday);
    const previous = index > 0 ? items[index - 1] : null;
    const previousGroup = previous ? dayGroupLabel(new Date(previous.createdAt), today, yesterday) : null;
    return { notification, group, showGroupLabel: group !== previousGroup };
  });

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Activity Timeline" description="What's happened recently" />
      <div className="rounded-xl border bg-card p-5">
        {isLoading || !data ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex gap-3">
                <LoadingSkeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2 pt-0.5">
                  <LoadingSkeleton className="h-3.5 w-3/4" />
                  <LoadingSkeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={History} title="No activity yet" description="Updates on your Kaizens will show up here as they happen." />
        ) : (
          <ol className="flex flex-col">
            {groupedItems.map(({ notification, group, showGroupLabel }, index) => {
              const date = new Date(notification.createdAt);
              const Icon = NOTIFICATION_TYPE_ICON[notification.type] ?? Trophy;
              const tone = getNotificationTone(notification.type);
              const isLast = index === groupedItems.length - 1;

              return (
                <motion.li
                  key={notification.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUpVariants}
                  transition={{ delay: index * 0.04 }}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {!isLast ? <span className="bg-border absolute top-8 left-4 w-px" style={{ bottom: 0 }} aria-hidden="true" /> : null}
                  <span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", TONE_DOT_CLASS[tone])}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                    {showGroupLabel ? (
                      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">{group}</p>
                    ) : null}
                    <p className="text-sm leading-snug font-medium">{notification.title}</p>
                    <p className="text-muted-foreground truncate text-xs leading-snug">{notification.body}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
        {data && data.items.length > 0 ? (
          <Link href="/notifications" className="text-primary mt-4 block text-sm font-medium hover:underline">
            View all activity →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
