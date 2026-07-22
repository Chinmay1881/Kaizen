import { z } from "zod";

/**
 * One schema for the whole wizard rather than one per step — all steps share a single React Hook
 * Form instance (see kaizen-wizard.tsx) so state survives Previous/Next without any extra
 * plumbing. Per-step validation uses RHF's `trigger(fieldNames)` against the relevant slice of
 * this schema (see STEP_FIELD_NAMES below), not a separate schema per step.
 *
 * 6 steps: Basics, Process (now includes attachments), Cost of Implementation, 5W1H, Benefits,
 * Review. The dedicated Attachments step and the 5 Whys step were both removed — attachments now
 * live inside Step 2, and Cost of Implementation replaces 5 Whys as Step 3.
 */
export const wizardSchema = z.object({
  // Step 1 — Basics
  title: z
    .string()
    .trim()
    .min(10, "Title must be at least 10 characters.")
    .max(120, "Title must be at most 120 characters."),
  categoryId: z.string().min(1, "Please select a category."),
  departmentId: z.string().min(1, "Department is required."),
  problemStatement: z
    .string()
    .trim()
    .min(1, "Problem statement is required.")
    .max(1000, "Problem statement must be at most 1000 characters."),

  // Step 2 — Process (+ attachments, documenting the current process)
  currentProcess: z
    .string()
    .trim()
    .min(1, "Current process is required.")
    .max(1500, "Current process must be at most 1500 characters."),
  proposedSolution: z
    .string()
    .trim()
    .min(1, "Proposed solution is required.")
    .max(1500, "Proposed solution must be at most 1500 characters."),
  // Each entry is a real, already-uploaded `KaizenAttachment` (uploaded immediately on
  // selection — see attachment-uploader.tsx) rather than pre-upload local metadata, so a resumed
  // draft (autosave writes this to localStorage) reflects what's actually on the server instead
  // of files that were never really attached.
  attachments: z
    .array(
      z.object({
        id: z.string(),
        fileName: z.string(),
        fileSizeBytes: z.number(),
        mimeType: z.string(),
        cloudinarySecureUrl: z.string(),
      }),
    )
    .max(10, "Maximum 10 files."),

  // Step 3 — Cost of Implementation. Required fields mirror the backend's submit-time check
  // (kaizen.service.ts#validateForSubmit) exactly, so a user can never reach Step 6 and be
  // rejected by the server for something Step 3 should have already caught.
  costOfImplementation: z
    .object({
      // Plain `z.number()`, not `z.coerce.number()` — numeric <input>s use RHF's own
      // `valueAsNumber` (see step-3-cost-of-implementation.tsx's `register` calls) instead, since
      // combining Zod coercion with zodResolver's generic input/output inference here breaks
      // `useForm<WizardFormValues>`'s type (coercion makes the schema's *input* type `unknown`,
      // which the resolver then can't reconcile with `WizardFormValues` as the form's value type).
      // Same reason there's no `.default(...)` anywhere below — a Zod default makes the *input*
      // type optional while the *output* type stays required, which breaks that same resolver
      // typing. Defaults are seeded once instead, via WIZARD_DEFAULT_VALUES /
      // kaizen-detail-to-form-values.ts.
      costType: z.enum(["ONE_TIME", "RECURRING"], { message: "Please select a cost type." }),
      estimatedCost: z.number().min(0, "Must be 0 or more."),
      currency: z.string().trim().min(1).max(10),
      estimatedDurationValue: z.number().int().min(1, "Duration is required."),
      estimatedDurationUnit: z.enum(["DAYS", "WEEKS"], { message: "Please select a duration unit." }),
      employeesRequired: z.number().int().min(0).optional(),
      departmentIds: z.array(z.string()),
      materialsRequired: z.string().trim().max(1000).optional(),
      machinesRequired: z.string().trim().max(1000).optional(),
      vendorRequired: z.boolean(),
      vendorDetails: z.string().trim().max(1000).optional(),
      estimatedAnnualSavings: z.number().min(0, "Must be 0 or more."),
      timeSavedHoursPerDay: z.number().min(0).optional(),
      qualityImprovement: z.enum(["LOW", "MEDIUM", "HIGH"], { message: "Required." }),
      safetyImprovement: z.enum(["LOW", "MEDIUM", "HIGH"], { message: "Required." }),
      customerSatisfactionImprovement: z.enum(["LOW", "MEDIUM", "HIGH"], { message: "Required." }),
      wasteReductionImprovement: z.enum(["LOW", "MEDIUM", "HIGH"], { message: "Required." }),
      expectedPaybackPeriod: z.string().trim().max(100).optional(),
      additionalNotes: z.string().trim().max(1000).optional(),
    })
    .refine((value) => !value.vendorRequired || Boolean(value.vendorDetails?.trim()), {
      message: "Vendor details are required when an external vendor is needed.",
      path: ["vendorDetails"],
    }),

  // Step 4 — 5W1H
  fiveW1H: z.object({
    what: z.string().trim().min(1, "Required.").max(2000),
    whereLocation: z.string().trim().min(1, "Required.").max(2000),
    whenOccurs: z.string().trim().min(1, "Required.").max(2000),
    who: z.string().trim().min(1, "Required.").max(2000),
    why: z.string().trim().min(1, "Required.").max(2000),
    how: z.string().trim().min(1, "Required.").max(2000),
  }),

  // Step 5 — Benefits
  benefits: z
    .array(
      z.object({
        benefitType: z.string().min(1),
        description: z.string().trim().min(1, "Description is required.").max(500),
        isCustom: z.boolean(),
      }),
    )
    .min(1, "Add at least one expected benefit."),
  businessImpact: z.string().trim().max(500, "Must be at most 500 characters.").optional(),
  estimatedSavings: z.string().trim().max(500, "Must be at most 500 characters.").optional(),
});

export type WizardFormValues = z.infer<typeof wizardSchema>;

export const STEP_FIELD_NAMES: Record<number, (keyof WizardFormValues)[]> = {
  1: ["title", "categoryId", "departmentId", "problemStatement"],
  2: ["currentProcess", "proposedSolution", "attachments"],
  3: ["costOfImplementation"],
  4: ["fiveW1H"],
  5: ["benefits", "businessImpact", "estimatedSavings"],
  6: [],
};

// `costType`/`estimatedDurationUnit`/the four impact ratings are required-at-submit but have no
// sensible blank-draft default (an enum, unlike a string or array, has no empty value) — a brand
// new draft intentionally leaves them unset, so this is cast rather than fully satisfying
// `WizardFormValues`. The zod resolver still catches genuine incompleteness at submit time.
export const WIZARD_DEFAULT_VALUES = {
  title: "",
  categoryId: "",
  departmentId: "",
  problemStatement: "",
  currentProcess: "",
  proposedSolution: "",
  attachments: [],
  costOfImplementation: {
    currency: "INR",
    departmentIds: [],
    vendorRequired: false,
  },
  fiveW1H: { what: "", whereLocation: "", whenOccurs: "", who: "", why: "", how: "" },
  benefits: [],
  businessImpact: "",
  estimatedSavings: "",
} as unknown as WizardFormValues;
