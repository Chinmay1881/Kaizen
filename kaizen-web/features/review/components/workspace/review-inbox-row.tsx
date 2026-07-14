"use client";

import { forwardRef } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ReviewQueueItem } from "@/features/review/types/review";
import { IMPACT_BADGE_VARIANT, PRIORITY_BADGE_VARIANT } from "@/features/review/utils/badge-tones";
import { highlightMatch } from "@/features/review/utils/highlight-match";
import { cn } from "@/lib/utils";
import { formatRelativeTime, getInitialsFromName } from "@/utils/format";

interface ReviewInboxRowProps {
  kaizen: ReviewQueueItem;
  isSelected: boolean;
  searchQuery: string;
  onSelect: () => void;
}

/** One row = one Linear issue: avatar, title (search-highlighted), number/department, priority +
 * impact badges, relative submission time. `status === "SUBMITTED"` doubles as the "unread"
 * signal — this app has no per-manager read-tracking on Kaizens, but SUBMITTED genuinely does
 * mean "nobody has started reviewing this yet," which is the same thing an unread dot promises. */
export const ReviewInboxRow = forwardRef<HTMLButtonElement, ReviewInboxRowProps>(function ReviewInboxRow(
  { kaizen, isSelected, searchQuery, onSelect },
  ref,
) {
  const isUnread = kaizen.status === "SUBMITTED";

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors duration-150",
        isSelected ? "bg-primary/10" : "hover:bg-accent/50",
      )}
    >
      {isSelected ? <span aria-hidden="true" className="bg-primary absolute inset-y-0 left-0 w-0.5" /> : null}

      <Avatar alt={kaizen.submitter.displayName} fallback={getInitialsFromName(kaizen.submitter.displayName)} className="mt-0.5 h-8 w-8 shrink-0 text-xs" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-semibold">{highlightMatch(kaizen.title, searchQuery)}</p>
          {isUnread ? <span aria-label="Unread" className="bg-primary mt-1 h-1.5 w-1.5 shrink-0 rounded-full" /> : null}
        </div>
        <p className="text-muted-foreground truncate text-xs">
          {kaizen.kaizenNumber} · {kaizen.department.name}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant={PRIORITY_BADGE_VARIANT[kaizen.priority]} className="text-[10px]">
            {kaizen.priority}
          </Badge>
          <Badge variant={IMPACT_BADGE_VARIANT[kaizen.estimatedImpact]} className="text-[10px]">
            {kaizen.estimatedImpact}
          </Badge>
          <span className="text-muted-foreground ml-auto text-[11px]">
            {kaizen.submittedAt ? formatRelativeTime(kaizen.submittedAt) : formatRelativeTime(kaizen.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
});
