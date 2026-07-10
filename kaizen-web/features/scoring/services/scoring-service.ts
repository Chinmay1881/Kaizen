import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  Evaluation,
  KaizenScoreSummary,
  ScoringParameter,
  UpsertEvaluationInput,
} from "@/features/scoring/types/evaluation";

export const scoringService = {
  getParameters: async (token: string | null): Promise<ScoringParameter[]> => {
    const response = await apiClient<ApiSuccessResponse<ScoringParameter[]>>(
      "/scoring/parameters",
      { token: token ?? undefined },
    );
    return response.data;
  },

  getEvaluation: async (token: string | null, kaizenId: string): Promise<Evaluation | null> => {
    const response = await apiClient<ApiSuccessResponse<Evaluation | null>>(
      `/kaizens/${kaizenId}/evaluation`,
      { token: token ?? undefined },
    );
    return response.data;
  },

  upsertEvaluation: async (
    token: string | null,
    kaizenId: string,
    input: UpsertEvaluationInput,
  ): Promise<Evaluation> => {
    const response = await apiClient<ApiSuccessResponse<Evaluation>>(
      `/kaizens/${kaizenId}/evaluation`,
      { method: "PUT", token: token ?? undefined, body: JSON.stringify(input) },
    );
    return response.data;
  },

  submitEvaluation: async (token: string | null, kaizenId: string): Promise<Evaluation> => {
    const response = await apiClient<ApiSuccessResponse<Evaluation>>(
      `/kaizens/${kaizenId}/evaluation/submit`,
      { method: "POST", token: token ?? undefined },
    );
    return response.data;
  },

  getScore: async (token: string | null, kaizenId: string): Promise<KaizenScoreSummary> => {
    const response = await apiClient<ApiSuccessResponse<KaizenScoreSummary>>(
      `/kaizens/${kaizenId}/score`,
      { token: token ?? undefined },
    );
    return response.data;
  },
};
