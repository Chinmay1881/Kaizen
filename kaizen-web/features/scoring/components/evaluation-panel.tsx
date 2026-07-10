"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScoreRatingInput } from "@/features/scoring/components/score-rating-input";
import { useEvaluation } from "@/features/scoring/hooks/use-evaluation";
import {
  useSubmitEvaluation,
  useUpsertEvaluation,
} from "@/features/scoring/hooks/use-evaluation-mutations";
import { useScoringParameters } from "@/features/scoring/hooks/use-scoring-parameters";
import type { Confidence, Recommendation } from "@/features/scoring/types/evaluation";
import type { CurrentUser } from "@/features/auth/types/user";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import { ApiError } from "@/lib/api-client";
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

interface EvaluationPanelProps {
  kaizen: KaizenDetail;
  currentUser: CurrentUser | undefined;
}

/** SCORE-001's Interactive Evaluation Engine: one card per parameter, a live-updating summary
 * (total / overall rating), recommendation + confidence + remarks, Save Draft / Submit.
 *
 * Self-gates exactly like its siblings (ReviewActionPanel, ReviewCommentsPanel): per the API
 * spec's per-endpoint Auth lines ("Department Manager (same department)"), not SCORE-001's
 * broader module-level "User Access" list — same precedent Milestone 6 already established for
 * Approve/Reject (see PROJECT_STATUS.md). Only ever rendered for the acting department manager
 * while the Kaizen is UNDER_REVIEW — outside that window there's nothing to evaluate yet, or the
 * decision has already been made. */
export function EvaluationPanel({ kaizen, currentUser }: EvaluationPanelProps) {
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
    setScores(
      Object.fromEntries(evaluation.scores.map((entry) => [entry.parameterId, entry.score])),
    );
    setRecommendation(evaluation.recommendation);
    setConfidence(evaluation.confidence ?? "");
    setRemarks(evaluation.remarks ?? "");
    initializedRef.current = true;
  }, [evaluationQuery.data]);

  const isDeptManagerHere =
    currentUser?.role === "DEPARTMENT_MANAGER" &&
    currentUser.department?.id === kaizen.department.id;

  if (!isDeptManagerHere || kaizen.status !== "UNDER_REVIEW") {
    return null;
  }

  if (parametersQuery.isLoading || evaluationQuery.isLoading) {
    return (
      <Card>
        <CardContent className="space-y-2 p-5">
          <LoadingSkeleton className="h-5 w-1/3" />
          <LoadingSkeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const parameters = parametersQuery.data ?? [];
  const evaluation = evaluationQuery.data;

  if (evaluation?.isSubmitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evaluation Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{evaluation.recommendation.replaceAll("_", " ")}</Badge>
            {evaluation.confidence ? (
              <Badge variant="outline">
                Confidence: {evaluation.confidence.replaceAll("_", " ")}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span>
              <span className="text-muted-foreground">Total Score:</span> {evaluation.totalScore} /
              50
            </span>
            <span>
              <span className="text-muted-foreground">Overall Rating:</span>{" "}
              {evaluation.overallRating.toFixed(1)} / 10
            </span>
          </div>
          <ul className="text-muted-foreground flex flex-col gap-1">
            {evaluation.scores.map((entry) => (
              <li key={entry.parameterId}>
                {entry.parameter}:{" "}
                <span className="text-foreground font-medium">{entry.score}</span>
              </li>
            ))}
          </ul>
          {evaluation.remarks ? <p className="whitespace-pre-wrap">{evaluation.remarks}</p> : null}
          <p className="text-muted-foreground text-xs">
            Submitted {evaluation.submittedAt ? formatDate(evaluation.submittedAt) : "—"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const scoredCount = parameters.filter((parameter) => scores[parameter.id] !== undefined).length;
  const allScored = parameters.length > 0 && scoredCount === parameters.length;
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const overallRating = parameters.length > 0 ? Math.round((totalScore / 5) * 10) / 10 : 0;
  const canSave = allScored && recommendation !== "";

  function buildInput() {
    return {
      scores: parameters.map((parameter) => ({
        parameterId: parameter.id,
        score: scores[parameter.id] ?? 0,
      })),
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evaluate This Kaizen</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {parameters.map((parameter) => (
          <div key={parameter.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium">{parameter.name}</p>
              <p className="text-muted-foreground text-sm">
                {scores[parameter.id] ?? "—"} / {parameter.maxScore}
              </p>
            </div>
            <p className="text-muted-foreground text-xs">{parameter.description}</p>
            <ScoreRatingInput
              label={parameter.name}
              max={parameter.maxScore}
              value={scores[parameter.id]}
              onChange={(score) => setScores((prev) => ({ ...prev, [parameter.id]: score }))}
              disabled={isPending}
            />
            <p className="text-muted-foreground text-xs">{parameter.guidelines}</p>
          </div>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm font-medium">
          <span>Total Score: {totalScore} / 50</span>
          <span>Overall Rating: {overallRating.toFixed(1)} / 10</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Recommendation</label>
            <Select
              value={recommendation}
              onChange={(event) => setRecommendation(event.target.value as Recommendation)}
              disabled={isPending}
            >
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
            <Select
              value={confidence}
              onChange={(event) => setConfidence(event.target.value as Confidence)}
              disabled={isPending}
            >
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
          <label className="text-sm font-medium">Remarks (optional)</label>
          <Textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Add any evaluation remarks..."
            rows={3}
            maxLength={2000}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={!allScored || isPending}>
            {upsert.isPending && !submit.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Save Draft
          </Button>
          <Button onClick={handleSubmit} disabled={!canSave || isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit Evaluation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
