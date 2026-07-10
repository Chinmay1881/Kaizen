"use client";

import { DetailSection } from "@/features/kaizen/components/detail/detail-section";
import { useKaizenScore } from "@/features/scoring/hooks/use-kaizen-score";
import { formatDate } from "@/utils/format";

interface ScoreSummarySectionProps {
  kaizenId: string;
}

/** Read-only evaluation score summary — shown on the submitter's own Kaizen detail page once a
 * reviewer has submitted an evaluation. Reuses GET /kaizens/:id/score (Auth: "Required (scoped)",
 * which already includes the submitter) rather than a separate endpoint. Renders nothing before
 * any evaluation has been submitted, so it doesn't clutter the page with an empty section. */
export function ScoreSummarySection({ kaizenId }: ScoreSummarySectionProps) {
  const { data: score, isLoading } = useKaizenScore(kaizenId);

  if (isLoading || !score || score.evaluations.length === 0) return null;

  return (
    <DetailSection title="Evaluation Score">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium">
          <span>Total Score: {score.totalScore} / 50</span>
          <span>Overall Rating: {score.overallRating.toFixed(1)} / 10</span>
        </div>
        {score.evaluations.map((evaluation, index) => (
          <div key={index} className="rounded-lg border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{evaluation.reviewer.displayName}</p>
              <p className="text-muted-foreground text-xs">
                {evaluation.submittedAt ? formatDate(evaluation.submittedAt) : "—"}
              </p>
            </div>
            <ul className="text-muted-foreground mt-1 flex flex-col gap-0.5">
              {evaluation.scores.map((entry) => (
                <li key={entry.parameter}>
                  {entry.parameter}:{" "}
                  <span className="text-foreground font-medium">{entry.score}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </DetailSection>
  );
}
