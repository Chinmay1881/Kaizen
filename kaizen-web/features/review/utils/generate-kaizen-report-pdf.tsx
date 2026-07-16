import { pdf } from "@react-pdf/renderer";

import { KaizenReportDocument } from "@/features/review/components/print/kaizen-report-document";
import type { KaizenReportData } from "@/features/review/utils/kaizen-report-data";
import { downloadBlob } from "@/lib/download";

/** Generates the report entirely client-side from data the caller already has in hand (the same
 * `KaizenDetail`/score/timeline/comments/implementation/business-impact queries the workspace
 * already fetched to render the screen) — no server round-trip, no re-fetching. */
export async function downloadKaizenReportPdf(data: KaizenReportData): Promise<void> {
  const blob = await pdf(<KaizenReportDocument {...data} />).toBlob();
  downloadBlob(blob, `${data.kaizen.kaizenNumber}-report.pdf`);
}
