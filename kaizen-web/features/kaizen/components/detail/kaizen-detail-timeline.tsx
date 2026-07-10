"use client";

import { Clock } from "lucide-react";

import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { DetailSection } from "@/features/kaizen/components/detail/detail-section";
import { useKaizenTimeline } from "@/features/kaizen/hooks/use-kaizen-timeline";
import { formatDate } from "@/utils/format";

/** Only DRAFT_CREATED/SUBMITTED are ever written today (see kaizen.service.ts) — other
 * TimelineEventType values exist in the schema for future milestones (Review, Implementation,
 * etc.) and fall back to a humanized version of the raw enum. */
function humanizeEventType(eventType: string): string {
  return eventType
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface KaizenDetailTimelineProps {
  kaizenId: string;
}

export function KaizenDetailTimeline({ kaizenId }: KaizenDetailTimelineProps) {
  const { data: events, isLoading } = useKaizenTimeline(kaizenId);

  return (
    <DetailSection title="Timeline">
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <LoadingSkeleton className="h-5 w-full" />
          <LoadingSkeleton className="h-5 w-2/3" />
        </div>
      ) : !events || events.length === 0 ? (
        <p className="text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {events.map((event) => (
            <li key={event.id} className="flex gap-3">
              <Clock className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">{humanizeEventType(event.eventType)}</p>
                <p className="text-muted-foreground">{event.description}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDate(event.createdAt)}
                  {event.actor ? ` · ${event.actor.displayName}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </DetailSection>
  );
}
