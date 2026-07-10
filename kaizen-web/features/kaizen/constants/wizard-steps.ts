export interface WizardStepMeta {
  id: number;
  label: string;
}

/** Order and grouping match this milestone's brief exactly (7 steps), which condenses the
 * original 11-step KAIZEN-001 spec (Category+BasicInfo+Problem merged into Step 1, Current
 * Process+Proposed Solution moved up to Step 2, Review+Submit merged into Step 7). */
export const WIZARD_STEPS: WizardStepMeta[] = [
  { id: 1, label: "Basics" },
  { id: 2, label: "Process" },
  { id: 3, label: "5 Why" },
  { id: 4, label: "5W1H" },
  { id: 5, label: "Benefits" },
  { id: 6, label: "Attachments" },
  { id: 7, label: "Review" },
];

export const TOTAL_STEPS = WIZARD_STEPS.length;
