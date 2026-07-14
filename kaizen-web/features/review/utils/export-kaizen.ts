import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import type { Evaluation } from "@/features/scoring/types/evaluation";
import type { TimelineEventItem } from "@/features/kaizen/types/kaizen";
import { downloadBlob } from "@/lib/download";

/**
 * "Export" for a single Kaizen in the Review Workspace: a client-side JSON download of exactly
 * what's already loaded (no network call, nothing invented). Deliberately not a new PDF/Excel
 * generator — that engine already exists for multi-Kaizen Reports (Milestone 11) and duplicating
 * it here for a single record would be exactly the kind of "duplicate existing functionality"
 * this milestone rules out. `Print` (browser print-to-PDF, styled via `@media print`) covers the
 * document-formatted case; this covers "I want the raw record."
 */
export function exportKaizenAsJson(
  kaizen: KaizenDetail,
  evaluation: Evaluation | null | undefined,
  timeline: TimelineEventItem[] | undefined,
) {
  const payload = {
    kaizen,
    evaluation: evaluation ?? null,
    timeline: timeline ?? [],
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${kaizen.kaizenNumber}.json`);
}
