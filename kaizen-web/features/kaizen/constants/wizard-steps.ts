export interface WizardStepMeta {
  id: number;
  label: string;
}

/** 6 steps. Attachments were folded into Step 2 (Process) — there is no longer a dedicated
 * Attachments step. 5 Whys was removed entirely and replaced by Cost of Implementation. */
export const WIZARD_STEPS: WizardStepMeta[] = [
  { id: 1, label: "Basics" },
  { id: 2, label: "Process" },
  { id: 3, label: "Cost of Implementation" },
  { id: 4, label: "5W1H" },
  { id: 5, label: "Benefits" },
  { id: 6, label: "Review" },
];

export const TOTAL_STEPS = WIZARD_STEPS.length;
