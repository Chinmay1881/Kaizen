import { z } from "zod";

/** PUT /kaizens/:id/evaluation body — matches the API spec's documented shape exactly.
 * Per-score bounds (0–10) match the `evaluation_scores.score` CHECK documented in
 * 01_DATABASE_SCHEMA.md (not enforceable in Prisma's schema DSL — see Technical Debt); this is
 * the application-layer enforcement of that same bound. Whether the score set covers exactly the
 * active parameters is validated in the service (needs a DB lookup, not expressible in Zod alone). */
export const upsertEvaluationSchema = z
  .object({
    scores: z
      .array(
        z.object({
          parameterId: z.string().uuid(),
          score: z.number().int().min(0).max(10),
        }),
      )
      .min(1),
    recommendation: z.enum(["APPROVE", "REJECT", "NEEDS_CHANGES"]),
    confidence: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]).optional(),
    remarks: z.string().trim().max(2000).optional(),
  })
  .strict();

export type UpsertEvaluationSchema = z.infer<typeof upsertEvaluationSchema>;
