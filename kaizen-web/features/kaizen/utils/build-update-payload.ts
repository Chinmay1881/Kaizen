import {
  BUSINESS_IMPACT_TYPE,
  ESTIMATED_SAVINGS_TYPE,
} from "@/features/kaizen/constants/benefit-types";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";
import type { Benefit, CostOfImplementation, UpdateKaizenInput } from "@/features/kaizen/types/kaizen";

/** Only send costOfImplementation once the user has actually started filling it in — the object
 * always carries its defaults (`currency: "INR"`, `departmentIds: []`, `vendorRequired: false`),
 * so "has real content" means something beyond those defaults is set. Sending an all-defaults
 * object on every autosave before the user even reaches Step 3 would create a DB row with nothing
 * useful in it. */
function meaningfulCostOfImplementation(value: WizardFormValues["costOfImplementation"]): CostOfImplementation | undefined {
  const hasContent =
    value.costType != null ||
    value.estimatedCost != null ||
    value.estimatedDurationValue != null ||
    value.estimatedDurationUnit != null ||
    value.employeesRequired != null ||
    value.departmentIds.length > 0 ||
    Boolean(value.materialsRequired?.trim()) ||
    Boolean(value.machinesRequired?.trim()) ||
    value.vendorRequired ||
    value.estimatedAnnualSavings != null ||
    value.timeSavedHoursPerDay != null ||
    value.qualityImprovement != null ||
    value.safetyImprovement != null ||
    value.customerSatisfactionImprovement != null ||
    value.wasteReductionImprovement != null ||
    Boolean(value.expectedPaybackPeriod?.trim()) ||
    Boolean(value.additionalNotes?.trim());

  if (!hasContent) return undefined;

  return {
    ...value,
    materialsRequired: value.materialsRequired?.trim() || undefined,
    machinesRequired: value.machinesRequired?.trim() || undefined,
    vendorDetails: value.vendorDetails?.trim() || undefined,
    expectedPaybackPeriod: value.expectedPaybackPeriod?.trim() || undefined,
    additionalNotes: value.additionalNotes?.trim() || undefined,
  };
}

/**
 * Builds a PATCH /kaizens/:id body from the wizard's current (possibly incomplete) form state.
 * Autosave can fire from any step, so this must never send a field the backend's Zod schema would
 * reject — e.g. `problemStatement` requires a non-empty string *if present*, so empty/untouched
 * fields are omitted entirely rather than sent as `""`.
 */
export function buildUpdatePayload(values: WizardFormValues): UpdateKaizenInput {
  const fiveW1HEntries = Object.entries(values.fiveW1H).filter(
    ([, value]) => value.trim().length > 0,
  );
  const fiveW1H = fiveW1HEntries.length > 0 ? Object.fromEntries(fiveW1HEntries) : undefined;

  const costOfImplementation = meaningfulCostOfImplementation(values.costOfImplementation);

  const benefits: Benefit[] = [
    ...values.benefits,
    ...(values.businessImpact?.trim()
      ? [
          {
            benefitType: BUSINESS_IMPACT_TYPE,
            description: values.businessImpact.trim(),
            isCustom: true,
          },
        ]
      : []),
    ...(values.estimatedSavings?.trim()
      ? [
          {
            benefitType: ESTIMATED_SAVINGS_TYPE,
            description: values.estimatedSavings.trim(),
            isCustom: true,
          },
        ]
      : []),
  ];

  return {
    ...(values.title.trim() ? { title: values.title.trim() } : {}),
    ...(values.categoryId ? { categoryId: values.categoryId } : {}),
    ...(values.problemStatement.trim() ? { problemStatement: values.problemStatement.trim() } : {}),
    ...(values.currentProcess.trim() ? { currentProcess: values.currentProcess.trim() } : {}),
    ...(values.proposedSolution.trim() ? { proposedSolution: values.proposedSolution.trim() } : {}),
    ...(fiveW1H ? { fiveW1H } : {}),
    ...(costOfImplementation ? { costOfImplementation } : {}),
    ...(benefits.length > 0 ? { benefits } : {}),
  };
}
