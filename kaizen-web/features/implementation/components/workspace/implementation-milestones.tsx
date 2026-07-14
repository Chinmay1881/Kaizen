"use client";

import { motion } from "framer-motion";
import { CheckCircle2, CircleDashed, ShieldCheck, ShieldX, Sparkles, TrendingUp, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { KaizenDetail, TimelineEventItem } from "@/features/kaizen/types/kaizen";
import type { Implementation } from "@/features/implementation/types/implementation";
import { fadeInUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatDate, formatRelativeTime } from "@/utils/format";

interface Milestone {
  key: string;
  label: string;
  icon: LucideIcon;
  reached: boolean;
  tone: "success" | "destructive" | "muted";
  timestamp: string | null;
}

function findEvent(timeline: TimelineEventItem[] | undefined, eventType: string): TimelineEventItem | undefined {
  return timeline?.find((event) => event.eventType === eventType);
}

/**
 * Real milestones only — this data model has no "Mid Review"/"Testing" concept (those were the
 * brief's own illustrative example, not real stages), so the tracker uses exactly the lifecycle
 * events this app actually records: Approved, Assigned, In Progress (derived from
 * `progressPercent > 0`, since progress updates don't write their own timeline event),
 * Completed, Verified, Business Impact Recorded.
 */
function buildMilestones(kaizen: KaizenDetail, implementation: Implementation, timeline: TimelineEventItem[] | undefined, hasBusinessImpact: boolean): Milestone[] {
  const approvedEvent = findEvent(timeline, "APPROVED");
  const assignedEvent = findEvent(timeline, "IMPLEMENTATION_ASSIGNED");
  const verifyEvent = findEvent(timeline, "STATUS_CHANGED");

  return [
    { key: "approved", label: "Approved", icon: CheckCircle2, reached: true, tone: "success", timestamp: approvedEvent?.createdAt ?? null },
    { key: "assigned", label: "Assigned", icon: UserCheck, reached: true, tone: "success", timestamp: assignedEvent?.createdAt ?? implementation.createdAt },
    {
      key: "in-progress",
      label: "In Progress",
      icon: TrendingUp,
      reached: implementation.progressPercent > 0,
      tone: implementation.progressPercent > 0 ? "success" : "muted",
      timestamp: implementation.progressPercent > 0 ? implementation.updatedAt : null,
    },
    { key: "completed", label: "Completed", icon: CheckCircle2, reached: Boolean(implementation.completedAt), tone: "success", timestamp: implementation.completedAt },
    {
      key: "verified",
      label: implementation.verificationStatus === "REJECTED" ? "Verification Rejected" : "Verified",
      icon: implementation.verificationStatus === "REJECTED" ? ShieldX : ShieldCheck,
      reached: implementation.verificationStatus !== "PENDING",
      tone: implementation.verificationStatus === "REJECTED" ? "destructive" : implementation.verificationStatus === "VERIFIED" ? "success" : "muted",
      timestamp: implementation.verifiedAt ?? verifyEvent?.createdAt ?? null,
    },
    { key: "business-impact", label: "Business Impact Recorded", icon: Sparkles, reached: hasBusinessImpact, tone: hasBusinessImpact ? "success" : "muted", timestamp: null },
  ];
}

const TONE_CLASS: Record<Milestone["tone"], string> = {
  success: "bg-success text-success-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  muted: "bg-muted text-muted-foreground",
};

interface ImplementationMilestonesProps {
  kaizen: KaizenDetail;
  implementation: Implementation;
  timeline: TimelineEventItem[] | undefined;
  hasBusinessImpact: boolean;
  variant?: "compact" | "full";
}

export function ImplementationMilestones({ kaizen, implementation, timeline, hasBusinessImpact, variant = "full" }: ImplementationMilestonesProps) {
  const milestones = buildMilestones(kaizen, implementation, timeline, hasBusinessImpact);

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1" role="list" aria-label="Implementation milestones">
        {milestones.map((milestone, index) => (
          <div key={milestone.key} className="flex items-center gap-1" role="listitem">
            <span
              title={`${milestone.label}${milestone.timestamp ? ` — ${formatDate(milestone.timestamp)}` : ""}`}
              className={cn("flex h-6 w-6 items-center justify-center rounded-full", milestone.reached ? TONE_CLASS[milestone.tone] : "bg-muted text-muted-foreground")}
            >
              {milestone.reached ? <milestone.icon className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />}
            </span>
            {index < milestones.length - 1 ? <span className={cn("h-px w-4", milestone.reached ? "bg-success" : "bg-border")} aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <ol className="flex flex-col">
      {milestones.map((milestone, index) => {
        const isLast = index === milestones.length - 1;
        return (
          <motion.li key={milestone.key} initial="hidden" animate="visible" variants={fadeInUpVariants} transition={{ delay: index * 0.05 }} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast ? <span className="bg-border absolute top-8 left-4 w-px" style={{ bottom: 0 }} aria-hidden="true" /> : null}
            <span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", milestone.reached ? TONE_CLASS[milestone.tone] : "bg-muted text-muted-foreground")}>
              {milestone.reached ? <milestone.icon className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
              <p className={cn("text-sm font-medium", !milestone.reached && "text-muted-foreground")}>{milestone.label}</p>
              <p className="text-muted-foreground text-xs">
                {milestone.reached ? (milestone.timestamp ? formatRelativeTime(milestone.timestamp) : "Reached") : "Not yet reached"}
              </p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
