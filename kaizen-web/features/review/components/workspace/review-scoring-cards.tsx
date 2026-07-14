"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/feedback/success-toast";
import { ScoreRatingInput } from "@/features/scoring/components/score-rating-input";
import { useEvaluation } from "@/features/scoring/hooks/use-evaluation";
import { useSubmitEvaluation, useUpsertEvaluation } from "@/features/scoring/hooks/use-evaluation-mutations";
import { useScoringParameters } from "@/features/scoring/hooks/use-scoring-parameters";
import type { Confidence, Recommendation } from "@/features/scoring/types/evaluation";
import type { CurrentUser } from "@/features/auth/types/user";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import { useCountUp } from "@/hooks/use-count-up";
import { ApiError } from "@/lib/api-client";
import { canManageKaizenReview } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/format";

const RECOMMENDATION_OPTIONS: { value: Recommendation; label: string }[] = [
  { value: "APPROVE", label: "Approve" },
  { value: "REJECT", label: "Reject" },
  { value: "NEEDS_CHANGES", label: "Needs Changes" },
];

const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "VERY_HIGH", label: "Very High" },
];

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/** An advisory hint only — separate from the `recommendation` field the manager must still
 * explicitly choose (Approve/Reject still requires it to match, exactly as before). Purely a
 * "here's what this score suggests" nudge, never auto-applied. */
function suggestedRecommendation(overallRating: number): string {
  if (overallRating >= 7) return "Approve";
  if (overallRating >= 4) return "Needs Changes";
  return "Reject";
}

interface ReviewScoringCardsProps {
  kaizen: KaizenDetail;
  currentUser: CurrentUser | undefined;
}

/**
 * Review-exclusive rebuild of `features/scoring/components/evaluation-panel.tsx` (now deleted —
 * nothing else imported it). Same hooks, same `UpsertEvaluationInput`/submit calls. Presentation
 * only: one card per criterion with a colored progress indicator, a live running total, and an
 * advisory recommendation hint. Gating (UNDER_REVIEW only, plus `canManageKaizenReview` — the
 * Kaizen's own Department Manager, or CMD/Super Admin unconditionally) matches the backend's
 * `ScoringService.assertCanManage` exactly (Milestone 20).
 */
export function ReviewScoringCards({ kaizen, currentUser }: ReviewScoringCardsProps) {
  const kaizenId = kaizen.id;
  const parametersQuery = useScoringParameters();
  const evaluationQuery = useEvaluation(kaizenId);
  const upsert = useUpsertEvaluation(kaizenId);
  const submit = useSubmitEvaluation(kaizenId);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [recommendation, setRecommendation] = useState<Recommendation | "">("");
  const [confidence, setConfidence] = useState<Confidence | "">("");
  const [remarks, setRemarks] = useState("");
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !evaluationQuery.data) return;
    const evaluation = evaluationQuery.data;
    setScores(Object.fromEntries(evaluation.scores.map((entry) => [entry.parameterId, entry.score])));
    setRecommendation(evaluation.recommendation);
    setConfidence(evaluation.confidence ?? "");
    setRemarks(evaluation.remarks ?? "");
    initializedRef.current = true;
  }, [evaluationQuery.data]);

  // Computed and passed to `useCountUp` unconditionally, before any early return below — hooks
  // can't follow a conditional `return` and still fire in the same order every render.
  const totalScoreForCountUp = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const animatedTotal = useCountUp(totalScoreForCountUp, 400);

  const canEvaluate = currentUser ? canManageKaizenReview(currentUser, kaizen) : false;

  if (!canEvaluate || kaizen.status !== "UNDER_REVIEW") {
    return null;
  }

  if (parametersQuery.isLoading || evaluationQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-24 w-full" />
      </div>
    );
  }

  const parameters = parametersQuery.data ?? [];
  const evaluation = evaluationQuery.data;

  if (evaluation?.isSubmitted) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{evaluation.recommendation.replaceAll("_", " ")}</Badge>
          {evaluation.confidence ? <Badge variant="outline">Confidence: {evaluation.confidence.replaceAll("_", " ")}</Badge> : null}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {evaluation.scores.map((entry) => (
            <div key={entry.parameterId} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span className="text-muted-foreground">{entry.parameter}</span>
              <span data-metric className="font-semibold">
                {entry.score}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium">
          <span>
            <span className="text-muted-foreground">Total Score:</span> {evaluation.totalScore} / 50
          </span>
          <span>
            <span className="text-muted-foreground">Overall Rating:</span> {evaluation.overallRating.toFixed(1)} / 10
          </span>
        </div>
        {evaluation.remarks ? <p className="text-sm whitespace-pre-wrap">{evaluation.remarks}</p> : null}
        <p className="text-muted-foreground text-xs">Submitted {evaluation.submittedAt ? formatDate(evaluation.submittedAt) : "—"}</p>
      </div>
    );
  }

  const scoredCount = parameters.filter((parameter) => scores[parameter.id] !== undefined).length;
  const allScored = parameters.length > 0 && scoredCount === parameters.length;
  const totalScore = totalScoreForCountUp;
  const overallRating = parameters.length > 0 ? Math.round((totalScore / 5) * 10) / 10 : 0;
  const canSave = allScored && recommendation !== "";

  function buildInput() {
    return {
      scores: parameters.map((parameter) => ({ parameterId: parameter.id, score: scores[parameter.id] ?? 0 })),
      recommendation: recommendation as Recommendation,
      confidence: confidence || undefined,
      remarks: remarks.trim() || undefined,
    };
  }

  function handleSaveDraft() {
    upsert.mutate(buildInput(), {
      onSuccess: () => toast.success("Evaluation draft saved."),
      onError: (error) => toast.error(getErrorMessage(error, "Could not save evaluation.")),
    });
  }

  function handleSubmit() {
    upsert.mutate(buildInput(), {
      onSuccess: () => {
        submit.mutate(undefined, {
          onSuccess: () => toast.success("Evaluation submitted."),
          onError: (error) => toast.error(getErrorMessage(error, "Could not submit evaluation.")),
        });
      },
      onError: (error) => toast.error(getErrorMessage(error, "Could not save evaluation.")),
    });
  }

  const isPending = upsert.isPending || submit.isPending;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {parameters.map((parameter) => {
          const score = scores[parameter.id];
          const isScored = score !== undefined;

          return (
            <div key={parameter.id} className="relative overflow-hidden rounded-xl border p-4">
              <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", isScored ? "bg-primary" : "bg-border")} />
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">{parameter.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {score ?? "—"} / {parameter.maxScore}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs">{parameter.description}</p>
                <ScoreRatingInput label={parameter.name} max={parameter.maxScore} value={score} onChange={(next) => setScores((prev) => ({ ...prev, [parameter.id]: next }))} disabled={isPending} />
                <p className="text-muted-foreground text-xs">{parameter.guidelines}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-muted-foreground text-xs">Total Score</p>
            <p data-metric className="text-2xl font-semibold tabular-nums">
              {Math.round(animatedTotal)} / 50
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Overall Rating</p>
            <p data-metric className="text-2xl font-semibold tabular-nums">
              {overallRating.toFixed(1)} / 10
            </p>
          </div>
        </div>
        {allScored ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Sparkles className="text-achievement-foreground h-4 w-4" />
            <span className="text-muted-foreground">Suggests:</span>
            <span className="font-medium">{suggestedRecommendation(overallRating)}</span>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            {scoredCount} of {parameters.length} criteria scored
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Recommendation</label>
          <Select value={recommendation} onChange={(event) => setRecommendation(event.target.value as Recommendation)} disabled={isPending}>
            <option value="">Select a recommendation...</option>
            {RECOMMENDATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Confidence (optional)</label>
          <Select value={confidence} onChange={(event) => setConfidence(event.target.value as Confidence)} disabled={isPending}>
            <option value="">Not specified</option>
            {CONFIDENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Reviewer Notes (optional)</label>
        <Textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Add any evaluation remarks..." rows={3} maxLength={2000} disabled={isPending} />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={handleSaveDraft} disabled={!allScored || isPending}>
          {upsert.isPending && !submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Draft
        </Button>
        <Button onClick={handleSubmit} disabled={!canSave || isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Submit Evaluation
        </Button>
      </div>
    </div>
  );
}
