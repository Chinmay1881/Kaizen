import { z } from "zod";

/**
 * One schema for the whole wizard rather than 7 separate ones — all 7 steps share a single
 * React Hook Form instance (see kaizen-wizard.tsx) so state survives Previous/Next without any
 * extra plumbing. Per-step validation uses RHF's `trigger(fieldNames)` against the relevant slice
 * of this schema (see STEP_FIELD_NAMES below), not a separate schema per step.
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

  // Step 2 — Process
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

  // Step 3 — 5 Why
  fiveWhy: z
    .array(
      z.object({
        level: z.number().int().min(1).max(5),
        answer: z
          .string()
          .trim()
          .min(3, "Give a short answer for each Why.")
          .max(1000, "Answer must be at most 1000 characters."),
      }),
    )
    .length(5),

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

  // Step 6 — Attachments. Each entry is a real, already-uploaded `KaizenAttachment` (uploaded
  // immediately on selection — see step-6-attachments.tsx) rather than pre-upload local metadata,
  // so a resumed draft (autosave writes this to localStorage) reflects what's actually on the
  // server instead of files that were never really attached.
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
});

export type WizardFormValues = z.infer<typeof wizardSchema>;

export const STEP_FIELD_NAMES: Record<number, (keyof WizardFormValues)[]> = {
  1: ["title", "categoryId", "departmentId", "problemStatement"],
  2: ["currentProcess", "proposedSolution"],
  3: ["fiveWhy"],
  4: ["fiveW1H"],
  5: ["benefits", "businessImpact", "estimatedSavings"],
  6: ["attachments"],
  7: [],
};

export const WIZARD_DEFAULT_VALUES: WizardFormValues = {
  title: "",
  categoryId: "",
  departmentId: "",
  problemStatement: "",
  currentProcess: "",
  proposedSolution: "",
  fiveWhy: [1, 2, 3, 4, 5].map((level) => ({ level, answer: "" })),
  fiveW1H: { what: "", whereLocation: "", whenOccurs: "", who: "", why: "", how: "" },
  benefits: [],
  businessImpact: "",
  estimatedSavings: "",
  attachments: [],
};
