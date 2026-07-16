import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import type { ReviewComment } from "@/features/review/types/review";
import type { TimelineEventItem } from "@/features/kaizen/types/kaizen";
import type { KaizenScoreSummary } from "@/features/scoring/types/evaluation";
import type { BusinessImpact, Implementation } from "@/features/implementation/types/implementation";

export interface KaizenReportData {
  kaizen: KaizenDetail;
  score: KaizenScoreSummary | null;
  timeline: TimelineEventItem[];
  comments: ReviewComment[];
  implementation: Implementation | null;
  businessImpact: BusinessImpact | null;
}

/** "Approval Date" has no dedicated field on `KaizenDetail` (the backend sets it internally via
 * `workflowService.transition`'s `extraData`, but never exposes it through the API) — derived
 * honestly from the one real place it's observable: the timeline event the transition itself
 * creates. Returns `null`, not a guess, when no such event exists yet. */
export function findApprovalDate(timeline: TimelineEventItem[]): string | null {
  return timeline.find((event) => event.eventType === "APPROVED")?.createdAt ?? null;
}

export function findApprover(timeline: TimelineEventItem[]): string | null {
  return timeline.find((event) => event.eventType === "APPROVED")?.actor?.displayName ?? null;
}

/** Same derivation `decision-center.tsx` uses for its "Implementation Readiness" fact row —
 * duplicated here rather than imported (a UI component isn't a sensible dependency for a report
 * data adapter) since it's a small, stable, pure 4-line rule. */
export function implementationReadiness(kaizen: KaizenDetail, implementation: Implementation | null): string {
  if (kaizen.status === "APPROVED") return "Ready to assign";
  if (kaizen.status === "IMPLEMENTATION_IN_PROGRESS") return `${implementation?.progressPercent ?? 0}% in progress`;
  if (["IMPLEMENTATION_IN_PROGRESS", "IMPLEMENTATION_COMPLETED", "BUSINESS_IMPACT_RECORDED", "REWARD_ISSUED"].includes(kaizen.status)) {
    return "Completed";
  }
  return "Not yet approved";
}
