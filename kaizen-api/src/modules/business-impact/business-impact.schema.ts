import { z } from "zod";

/** POST /kaizens/:id/business-impact body — matches the API spec's documented shape exactly. */
export const recordBusinessImpactSchema = z
  .object({
    moneySaved: z.number().min(0).optional(),
    hoursSaved: z.number().min(0).optional(),
    employeesBenefited: z.number().int().min(0).optional(),
    customersBenefited: z.number().int().min(0).optional(),
    processImprovement: z.boolean().default(false),
    qualityImprovement: z.boolean().default(false),
    safetyImprovement: z.boolean().default(false),
    productivityImprovement: z.boolean().default(false),
    customerSatisfactionImprovement: z.boolean().default(false),
    remarks: z.string().trim().max(2000).optional(),
  })
  .strict();

export type RecordBusinessImpactSchema = z.infer<typeof recordBusinessImpactSchema>;
