import {
  BUSINESS_IMPACT_TYPE,
  ESTIMATED_SAVINGS_TYPE,
} from "@/features/kaizen/constants/benefit-types";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";
import type { Benefit, UpdateKaizenInput } from "@/features/kaizen/types/kaizen";

/**
 * Builds a PATCH /kaizens/:id body from the wizard's current (possibly incomplete) form state.
 * Autosave can fire from any step, so this must never send a field the backend's Zod schema would
 * reject — e.g. `fiveWhy[].answer` and `problemStatement` require non-empty strings *if present*,
 * so empty/untouched fields are omitted entirely rather than sent as `""`.
 */
export function buildUpdatePayload(values: WizardFormValues): UpdateKaizenInput {
  const filledFiveWhy = values.fiveWhy.filter((entry) => entry.answer.trim().length > 0);

  const fiveW1HEntries = Object.entries(values.fiveW1H).filter(
    ([, value]) => value.trim().length > 0,
  );
  const fiveW1H = fiveW1HEntries.length > 0 ? Object.fromEntries(fiveW1HEntries) : undefined;

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
    ...(filledFiveWhy.length > 0 ? { fiveWhy: filledFiveWhy } : {}),
    ...(benefits.length > 0 ? { benefits } : {}),
  };
}
