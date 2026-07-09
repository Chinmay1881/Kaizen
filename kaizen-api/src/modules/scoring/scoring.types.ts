export interface ScoringParameterItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  guidelines: string;
  maxScore: number;
  sortOrder: number;
}

export interface EvaluationScoreItem {
  parameterId: string;
  parameter: string;
  score: number;
}

export interface EvaluationItem {
  id: string;
  kaizenId: string;
  reviewer: { id: string; displayName: string };
  scores: EvaluationScoreItem[];
  recommendation: string;
  confidence: string | null;
  remarks: string | null;
  totalScore: number;
  overallRating: number;
  isSubmitted: boolean;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KaizenScoreSummary {
  totalScore: number;
  overallRating: number;
  evaluations: Array<{
    reviewer: { id: string; displayName: string };
    scores: Array<{ parameter: string; score: number }>;
    recommendation: string;
    submittedAt: string | null;
  }>;
}
