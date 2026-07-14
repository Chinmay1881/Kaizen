import type { BusinessImpact, Implementation } from "@/features/implementation/types/implementation";
import type { KaizenDetail, TimelineEventItem } from "@/features/kaizen/types/kaizen";
import { downloadBlob } from "@/lib/download";

/**
 * Client-side JSON download of everything already loaded for this implementation — no network
 * call, nothing invented. Not the same payload as the Review Workspace's `exportKaizenAsJson`
 * (that one includes an `Evaluation`, which doesn't apply here; this one includes the
 * `Implementation` record and `BusinessImpact`, which don't apply there), so this isn't
 * duplicate functionality, just the equivalent for a different stage of the same Kaizen.
 */
export function exportImplementationAsJson(kaizen: KaizenDetail, implementation: Implementation, businessImpact: BusinessImpact | null | undefined, timeline: TimelineEventItem[] | undefined) {
  const payload = {
    kaizen,
    implementation,
    businessImpact: businessImpact ?? null,
    timeline: timeline ?? [],
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${kaizen.kaizenNumber}-implementation.json`);
}
