import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { auditService } from "../audit/audit.service.js";
import { kaizenService } from "../kaizens/kaizen.service.js";
import type { UpsertEvaluationSchema } from "./scoring.schema.js";
import type {
  EvaluationItem,
  EvaluationScoreItem,
  KaizenScoreSummary,
  ScoringParameterItem,
} from "./scoring.types.js";
import type { UserRole } from "../../constants/roles.js";

interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

const EVALUATION_INCLUDE = {
  reviewer: { select: { id: true, displayName: true } },
  scores: { include: { parameter: { select: { id: true, name: true } } } },
} as const;

type EvaluationRow = {
  id: string;
  kaizenId: string;
  reviewer: { id: string; displayName: string };
  recommendation: string;
  confidence: string | null;
  remarks: string | null;
  totalScore: number;
  overallRating: unknown;
  isSubmitted: boolean;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  scores: { score: number; parameter: { id: string; name: string } }[];
};

function toEvaluationItem(evaluation: EvaluationRow): EvaluationItem {
  return {
    id: evaluation.id,
    kaizenId: evaluation.kaizenId,
    reviewer: evaluation.reviewer,
    scores: evaluation.scores.map((entry): EvaluationScoreItem => ({
      parameterId: entry.parameter.id,
      parameter: entry.parameter.name,
      score: entry.score,
    })),
    recommendation: evaluation.recommendation,
    confidence: evaluation.confidence,
    remarks: evaluation.remarks,
    totalScore: evaluation.totalScore,
    overallRating: Number(evaluation.overallRating),
    isSubmitted: evaluation.isSubmitted,
    submittedAt: evaluation.submittedAt?.toISOString() ?? null,
    createdAt: evaluation.createdAt.toISOString(),
    updatedAt: evaluation.updatedAt.toISOString(),
  };
}

/** Backs SCORE-001 / the API spec's "Scoring" section. Reuses `kaizenService.getById` for its
 * view-permission check wherever the spec says "Required (scoped)" or "Department Manager" — the
 * stricter "same department" actor check (matching ReviewService's `assertCanManage`) is applied
 * on top for the write endpoints, consistent with the rest of the Review Workspace. */
class ScoringService {
  /** GET /scoring/parameters — active parameters only, ordered for display. */
  async getParameters(): Promise<ScoringParameterItem[]> {
    const parameters = await prisma.scoringParameter.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return parameters.map((parameter) => ({
      id: parameter.id,
      name: parameter.name,
      slug: parameter.slug,
      description: parameter.description,
      guidelines: parameter.guidelines,
      maxScore: parameter.maxScore,
      sortOrder: parameter.sortOrder,
    }));
  }

  /** GET /kaizens/:id/evaluation — the requester's own evaluation (draft or submitted), or null
   * if they haven't started one yet. */
  async getEvaluation(kaizenId: string, requester: Requester): Promise<EvaluationItem | null> {
    const kaizen = await kaizenService.getById(kaizenId, requester);
    this.assertCanManage(kaizen, requester);

    const evaluation = await prisma.evaluation.findUnique({
      where: { kaizenId_reviewerId: { kaizenId, reviewerId: requester.id } },
      include: EVALUATION_INCLUDE,
    });

    return evaluation ? toEvaluationItem(evaluation) : null;
  }

  /** PUT /kaizens/:id/evaluation — create or update the requester's draft evaluation. */
  async upsertEvaluation(
    kaizenId: string,
    requester: Requester,
    input: UpsertEvaluationSchema,
  ): Promise<EvaluationItem> {
    const kaizen = await kaizenService.getById(kaizenId, requester);
    this.assertCanManage(kaizen, requester);

    const activeParameters = await prisma.scoringParameter.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    const activeParameterIds = new Set(activeParameters.map((parameter) => parameter.id));
    const inputParameterIds = new Set(input.scores.map((entry) => entry.parameterId));

    if (
      input.scores.length !== activeParameterIds.size ||
      inputParameterIds.size !== input.scores.length ||
      ![...inputParameterIds].every((id) => activeParameterIds.has(id))
    ) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Every active scoring parameter must receive exactly one score.",
        400,
        [{ field: "scores", message: "Every active scoring parameter must receive one score." }],
      );
    }

    const existing = await prisma.evaluation.findUnique({
      where: { kaizenId_reviewerId: { kaizenId, reviewerId: requester.id } },
    });

    if (existing?.isSubmitted) {
      throw new ApiError(
        "CONFLICT",
        "This evaluation has already been submitted and is read-only.",
        409,
      );
    }

    const totalScore = input.scores.reduce((sum, entry) => sum + entry.score, 0);
    const overallRating = Math.round((totalScore / 5) * 10) / 10;

    await prisma.$transaction(async (tx) => {
      const record = await tx.evaluation.upsert({
        where: { kaizenId_reviewerId: { kaizenId, reviewerId: requester.id } },
        create: {
          kaizenId,
          reviewerId: requester.id,
          recommendation: input.recommendation,
          confidence: input.confidence,
          remarks: input.remarks,
          totalScore,
          overallRating,
        },
        update: {
          recommendation: input.recommendation,
          confidence: input.confidence,
          remarks: input.remarks,
          totalScore,
          overallRating,
        },
      });

      await tx.evaluationScore.deleteMany({ where: { evaluationId: record.id } });
      await tx.evaluationScore.createMany({
        data: input.scores.map((entry) => ({
          evaluationId: record.id,
          parameterId: entry.parameterId,
          score: entry.score,
        })),
      });

      return record;
    });

    const result = await this.getEvaluation(kaizenId, requester);
    if (!result) throw new ApiError("INTERNAL_ERROR", "Failed to load saved evaluation.", 500);
    return result;
  }

  /** POST /kaizens/:id/evaluation/submit — finalizes the draft. Becomes read-only. */
  async submitEvaluation(kaizenId: string, requester: Requester): Promise<EvaluationItem> {
    const kaizen = await kaizenService.getById(kaizenId, requester);
    this.assertCanManage(kaizen, requester);

    const existing = await prisma.evaluation.findUnique({
      where: { kaizenId_reviewerId: { kaizenId, reviewerId: requester.id } },
    });

    if (!existing) {
      throw new ApiError("VALIDATION_ERROR", "Save an evaluation before submitting it.", 400, [
        { field: "scores", message: "No evaluation draft found for this Kaizen." },
      ]);
    }
    if (existing.isSubmitted) {
      throw new ApiError("CONFLICT", "This evaluation has already been submitted.", 409);
    }

    const submittedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.evaluation.update({
        where: { id: existing.id },
        data: { isSubmitted: true, submittedAt },
      });

      await tx.timelineEvent.create({
        data: {
          kaizenId,
          eventType: "EVALUATION_SUBMITTED",
          actorId: requester.id,
          description: "Evaluation submitted.",
        },
      });

      await auditService.record(
        {
          userId: requester.id,
          userRole: requester.role,
          action: "evaluation.submit",
          entityType: "Evaluation",
          entityId: existing.id,
          previousValue: { isSubmitted: false },
          newValue: { isSubmitted: true, recommendation: existing.recommendation },
        },
        tx,
      );
    });

    const result = await this.getEvaluation(kaizenId, requester);
    if (!result) throw new ApiError("INTERNAL_ERROR", "Failed to load submitted evaluation.", 500);
    return result;
  }

  /** GET /kaizens/:id/score — aggregated, MVP: simple average across submitted evaluations
   * (there is normally exactly one, per the unique department-manager-per-department model). */
  async getScore(kaizenId: string, requester: Requester): Promise<KaizenScoreSummary> {
    await kaizenService.getById(kaizenId, requester);

    const evaluations = await prisma.evaluation.findMany({
      where: { kaizenId, isSubmitted: true },
      include: EVALUATION_INCLUDE,
      orderBy: { submittedAt: "asc" },
    });

    if (evaluations.length === 0) {
      return { totalScore: 0, overallRating: 0, evaluations: [] };
    }

    const items = evaluations.map(toEvaluationItem);
    const totalScore = Math.round(
      items.reduce((sum, item) => sum + item.totalScore, 0) / items.length,
    );
    const overallRating =
      Math.round((items.reduce((sum, item) => sum + item.overallRating, 0) / items.length) * 10) /
      10;

    return {
      totalScore,
      overallRating,
      evaluations: items.map((item) => ({
        reviewer: item.reviewer,
        scores: item.scores.map((score) => ({ parameter: score.parameter, score: score.score })),
        recommendation: item.recommendation,
        submittedAt: item.submittedAt,
      })),
    };
  }

  /** Matches ReviewService's `assertCanManage` exactly (Department Manager, same department) —
   * duplicated rather than shared since each service already owns its own small authorization
   * predicates (see kaizen.service.ts/review.service.ts) and this is a one-line check. */
  private assertCanManage(kaizen: { department: { id: string } }, requester: Requester): void {
    if (
      requester.role !== "DEPARTMENT_MANAGER" ||
      requester.departmentId !== kaizen.department.id
    ) {
      throw new ApiError(
        "FORBIDDEN",
        "Only the department manager for this Kaizen can evaluate it.",
        403,
      );
    }
  }
}

export const scoringService = new ScoringService();
