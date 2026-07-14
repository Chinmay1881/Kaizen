"use client";

import { forwardRef } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { highlightMatch } from "@/features/review/utils/highlight-match";
import { ProgressRing } from "@/features/implementation/components/workspace/progress-ring";
import type { Implementation } from "@/features/implementation/types/implementation";
import { getKanbanStage, KANBAN_STAGE_BADGE_CLASS, KANBAN_STAGE_LABEL } from "@/features/implementation/utils/kanban-stage";
import { cn } from "@/lib/utils";
import { formatRelativeTime, getInitialsFromName } from "@/utils/format";

interface ImplementationInboxRowProps {
  implementation: Implementation;
  isSelected: boolean;
  searchQuery: string;
  onSelect: () => void;
}

const VERIFICATION_BADGE_VARIANT: Record<string, "outline" | "success" | "destructive"> = {
  PENDING: "outline",
  VERIFIED: "success",
  REJECTED: "destructive",
};

/**
 * A project-management-style row. `Implementation`'s `kaizen` sub-object (returned by
 * `GET /implementations`) only carries `id`/`kaizenNumber`/`title`/`status`/`submitter`/
 * `department` — no `priority`/`estimatedImpact` — so unlike the Review Inbox this row can't show
 * a priority/impact badge without an extra per-row fetch; those live in the Control Center once a
 * row is selected and its full `KaizenDetail` loads instead.
 */
export const ImplementationInboxRow = forwardRef<HTMLButtonElement, ImplementationInboxRowProps>(function ImplementationInboxRow(
  { implementation, isSelected, searchQuery, onSelect },
  ref,
) {
  const stage = getKanbanStage(implementation);

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

      <ProgressRing value={implementation.progressPercent} size={40} strokeWidth={4} className="mt-0.5 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="min-w-0 truncate text-sm font-semibold">{highlightMatch(implementation.kaizen.title, searchQuery)}</p>
        <p className="text-muted-foreground truncate text-xs">
          {implementation.kaizen.kaizenNumber} · {implementation.assignedDepartment.name}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <Avatar alt={implementation.owner.displayName} fallback={getInitialsFromName(implementation.owner.displayName)} className="h-5 w-5 text-[10px]" />
          <span className="text-muted-foreground truncate text-xs">{implementation.owner.displayName}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium", KANBAN_STAGE_BADGE_CLASS[stage])}>
            {KANBAN_STAGE_LABEL[stage]}
          </span>
          <Badge variant={VERIFICATION_BADGE_VARIANT[implementation.verificationStatus]} className="text-[10px]">
            {implementation.verificationStatus}
          </Badge>
          <span className="text-muted-foreground ml-auto text-[11px]">
            {implementation.dueDate ? `Due ${formatRelativeTime(implementation.dueDate)}` : implementation.startedAt ? `Started ${formatRelativeTime(implementation.startedAt)}` : ""}
          </span>
        </div>
      </div>
    </button>
  );
});
