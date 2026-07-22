import { z } from "zod";

import { KAIZEN_PRIORITIES, ESTIMATED_IMPACTS } from "../../constants/kaizen-priority.js";
import { COST_TYPES, DURATION_UNITS, IMPACT_LEVELS } from "../../constants/cost-of-implementation.js";

export const createKaizenSchema = z.object({
  title: z.string().trim().max(120).optional(),
  departmentId: z.string().uuid().optional(),
});

const fiveW1HSchema = z
  .object({
    what: z.string().trim().max(2000).optional(),
    whereLocation: z.string().trim().max(2000).optional(),
    whenOccurs: z.string().trim().max(2000).optional(),
    who: z.string().trim().max(2000).optional(),
    why: z.string().trim().max(2000).optional(),
    how: z.string().trim().max(2000).optional(),
  })
  .optional();

const benefitSchema = z
  .array(
    z.object({
      benefitType: z.string().trim().min(1).max(50),
      description: z.string().trim().min(1).max(500),
      isCustom: z.boolean().optional(),
    }),
  )
  .optional();

/** Autosave can post this incomplete from any step, so every field is optional here — "required
 * for submit" is enforced separately in `kaizenService.validateForSubmit`, matching the
 * fiveW1H/benefits precedent. Value-level constraints (>= 0, vendor details required when a
 * vendor is needed) apply whenever a field IS present, draft or not. */
const costOfImplementationSchema = z
  .object({
    costType: z.enum(COST_TYPES).optional(),
    estimatedCost: z.number().min(0, "Estimated cost must be 0 or more.").optional(),
    currency: z.string().trim().min(1).max(10).optional(),
    estimatedDurationValue: z.number().int().min(1, "Duration must be at least 1.").optional(),
    estimatedDurationUnit: z.enum(DURATION_UNITS).optional(),
    employeesRequired: z.number().int().min(0).optional(),
    departmentIds: z.array(z.string().uuid()).optional(),
    materialsRequired: z.string().trim().max(1000).optional(),
    machinesRequired: z.string().trim().max(1000).optional(),
    vendorRequired: z.boolean().optional(),
    vendorDetails: z.string().trim().max(1000).optional(),
    estimatedAnnualSavings: z.number().min(0, "Estimated savings must be 0 or more.").optional(),
    timeSavedHoursPerDay: z.number().min(0).optional(),
    qualityImprovement: z.enum(IMPACT_LEVELS).optional(),
    safetyImprovement: z.enum(IMPACT_LEVELS).optional(),
    customerSatisfactionImprovement: z.enum(IMPACT_LEVELS).optional(),
    wasteReductionImprovement: z.enum(IMPACT_LEVELS).optional(),
    expectedPaybackPeriod: z.string().trim().max(100).optional(),
    additionalNotes: z.string().trim().max(1000).optional(),
  })
  .refine((value) => !value.vendorRequired || Boolean(value.vendorDetails?.trim()), {
    message: "Vendor details are required when an external vendor is needed.",
    path: ["vendorDetails"],
  })
  .optional();

export const updateKaizenSchema = z
  .object({
    title: z.string().trim().min(10).max(120).optional(),
    categoryId: z.string().uuid().optional(),
    priority: z.enum(KAIZEN_PRIORITIES).optional(),
    estimatedImpact: z.enum(ESTIMATED_IMPACTS).optional(),
    location: z.string().trim().max(120).optional(),
    problemStatement: z.string().trim().min(1).max(1000).optional(),
    currentProcess: z.string().trim().min(1).max(1500).optional(),
    proposedSolution: z.string().trim().min(1).max(1500).optional(),
    fiveW1H: fiveW1HSchema,
    costOfImplementation: costOfImplementationSchema,
    benefits: benefitSchema,
  })
  .strict();

/** GET /kaizens query params. `limit` is accepted as an alias for `pageSize` for convenience.
 * Milestone 11 Chunk 2 added `dateFrom`/`dateTo` (created-at range). */
export const listKaizensQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().trim().max(300).optional(),
  categoryId: z.string().uuid().optional(),
  priority: z.enum(KAIZEN_PRIORITIES).optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(["newest", "oldest", "updated"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateKaizenSchema = z.infer<typeof createKaizenSchema>;
export type UpdateKaizenSchema = z.infer<typeof updateKaizenSchema>;
export type ListKaizensQuerySchema = z.infer<typeof listKaizensQuerySchema>;
