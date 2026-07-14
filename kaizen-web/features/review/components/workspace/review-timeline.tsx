"use client";

import { motion } from "framer-motion";
import { History } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useKaizenTimeline } from "@/features/kaizen/hooks/use-kaizen-timeline";
import { getTimelineTone, humanizeEventType, TIMELINE_EVENT_ICON } from "@/features/review/utils/timeline-icons";
import { fadeInUpVariants } from "@/lib/motion";
import { TONE_DOT_CLASS } from "@/lib/tone-classes";
import { cn } from "@/lib/utils";
import { formatDate, formatRelativeTime } from "@/utils/format";

interface ReviewTimelineProps {
  kaizenId: string;
}

/** Rebuild of the old shared `KaizenDetailTimeline` (its plain Clock-icon version, deleted in
 * Milestone 15 — this component now covers every consumer: Review, Implementation, and the My
 * Ideas case-study page). Same `useKaizenTimeline` data, presented as a connected vertical
 * timeline with per-event icons/tones and relative timestamps. */
export function ReviewTimeline({ kaizenId }: ReviewTimelineProps) {
  const { data: events, isLoading } = useKaizenTimeline(kaizenId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <LoadingSkeleton className="h-5 w-full" />
        <LoadingSkeleton className="h-5 w-2/3" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return <EmptyState icon={History} title="No activity yet" description="This Kaizen's history will show up here." className="border-none px-0 py-6" />;
  }

  return (
    <ol className="flex flex-col">
      {events.map((event, index) => {
        const Icon = TIMELINE_EVENT_ICON[event.eventType] ?? History;
        const tone = getTimelineTone(event.eventType);
        const isLast = index === events.length - 1;

        return (
          <motion.li
            key={event.id}
            initial="hidden"
            animate="visible"
            variants={fadeInUpVariants}
            transition={{ delay: index * 0.04 }}
            className="relative flex gap-3 pb-6 last:pb-0"
          >
            {!isLast ? <span className="bg-border absolute top-8 left-4 w-px" style={{ bottom: 0 }} aria-hidden="true" /> : null}
            <span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", TONE_DOT_CLASS[tone])}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
              <p className="text-sm font-medium">{humanizeEventType(event.eventType)}</p>
              {event.description ? <p className="text-muted-foreground text-sm">{event.description}</p> : null}
              <p className="text-muted-foreground text-xs" title={formatDate(event.createdAt)}>
                {formatRelativeTime(event.createdAt)}
                {event.actor ? ` · ${event.actor.displayName}` : ""}
              </p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
