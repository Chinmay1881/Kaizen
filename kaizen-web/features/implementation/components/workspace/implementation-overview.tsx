"use client";

import { Calendar, HardHat } from "lucide-react";

import type { KaizenDetail, TimelineEventItem } from "@/features/kaizen/types/kaizen";
import type { Implementation } from "@/features/implementation/types/implementation";
import { ImplementationMilestones } from "@/features/implementation/components/workspace/implementation-milestones";
import { ProgressRing } from "@/features/implementation/components/workspace/progress-ring";
import { getKanbanStage, KANBAN_STAGE_BADGE_CLASS, KANBAN_STAGE_LABEL } from "@/features/implementation/utils/kanban-stage";
import { formatDate, formatRelativeTime } from "@/utils/format";

interface ImplementationOverviewProps {
  kaizen: KaizenDetail;
  implementation: Implementation;
  timeline: TimelineEventItem[] | undefined;
  hasBusinessImpact: boolean;
}

/** The "read a live project at a glance" header — status ribbon, large animated ring, current
 * stage, remaining work, and a compact milestone stepper. All from `Implementation`/`KaizenDetail`
 * fields already fetched by the workspace root; nothing new is requested here. */
export function ImplementationOverview({ kaizen, implementation, timeline, hasBusinessImpact }: ImplementationOverviewProps) {
  const stage = getKanbanStage(implementation);
  const remaining = 100 - implementation.progressPercent;

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at top right, color-mix(in oklch, var(--color-implementation) 8%, transparent), transparent 60%)" }}
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${KANBAN_STAGE_BADGE_CLASS[stage]}`}>{KANBAN_STAGE_LABEL[stage]}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">{kaizen.title}</h1>
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <HardHat className="h-3.5 w-3.5" />
            {implementation.progressPercent === 100 ? "Implementation complete" : `${remaining}% remaining`}
          </p>
          {implementation.dueDate ? (
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Calendar className="h-3 w-3" />
              Due {formatDate(implementation.dueDate)} ({formatRelativeTime(implementation.dueDate)})
            </p>
          ) : null}
          <ImplementationMilestones kaizen={kaizen} implementation={implementation} timeline={timeline} hasBusinessImpact={hasBusinessImpact} variant="compact" />
        </div>

        <ProgressRing value={implementation.progressPercent} size={128} strokeWidth={10} tone={stage === "BLOCKED" ? "destructive" : stage === "COMPLETED" ? "success" : "default"} />
      </div>
    </div>
  );
}
