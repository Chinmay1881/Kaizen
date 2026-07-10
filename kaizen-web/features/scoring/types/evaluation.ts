export interface ScoringParameter {
  id: string;
  name: string;
  slug: string;
  description: string;
  guidelines: string;
  maxScore: number;
  sortOrder: number;
}

export type Recommendation = "APPROVE" | "REJECT" | "NEEDS_CHANGES";
export type Confidence = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export interface EvaluationScoreEntry {
  parameterId: string;
  parameter: string;
  score: number;
}

export interface Evaluation {
  id: string;
  kaizenId: string;
  reviewer: { id: string; displayName: string };
  scores: EvaluationScoreEntry[];
  recommendation: Recommendation;
  confidence: Confidence | null;
  remarks: string | null;
  totalScore: number;
  overallRating: number;
  isSubmitted: boolean;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertEvaluationInput {
  scores: Array<{ parameterId: string; score: number }>;
  recommendation: Recommendation;
  confidence?: Confidence;
  remarks?: string;
}

export interface KaizenScoreSummary {
  totalScore: number;
  overallRating: number;
  evaluations: Array<{
    reviewer: { id: string; displayName: string };
    scores: Array<{ parameter: string; score: number }>;
    recommendation: Recommendation;
    submittedAt: string | null;
  }>;
}
