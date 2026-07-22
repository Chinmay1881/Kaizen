import { BUSINESS_IMPACT_TYPE, ESTIMATED_SAVINGS_TYPE } from "@/features/kaizen/constants/benefit-types";
import { WIZARD_DEFAULT_VALUES } from "@/features/kaizen/schemas/wizard-schema";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";

/**
 * The inverse of build-update-payload.ts — seeds the wizard's form state from an existing
 * `KaizenDetail` for Edit Mode. `businessImpact`/`estimatedSavings` are pulled back out of the
 * `benefits` array (they're stored there as fixed-type entries, not their own columns — see
 * benefit-types.ts) so they land back in their own text fields instead of showing up twice in
 * Step 5's benefit list.
 */
export function kaizenDetailToFormValues(kaizen: KaizenDetail): WizardFormValues {
  const businessImpact = kaizen.benefits.find((benefit) => benefit.benefitType === BUSINESS_IMPACT_TYPE);
  const estimatedSavings = kaizen.benefits.find((benefit) => benefit.benefitType === ESTIMATED_SAVINGS_TYPE);
  const regularBenefits = kaizen.benefits.filter(
    (benefit) => benefit.benefitType !== BUSINESS_IMPACT_TYPE && benefit.benefitType !== ESTIMATED_SAVINGS_TYPE,
  );

  return {
    title: kaizen.title,
    categoryId: kaizen.category?.id ?? "",
    departmentId: kaizen.department.id,
    problemStatement: kaizen.problemStatement ?? "",
    currentProcess: kaizen.currentProcess ?? "",
    proposedSolution: kaizen.proposedSolution ?? "",
    attachments: kaizen.attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      fileSizeBytes: attachment.fileSizeBytes,
      mimeType: attachment.mimeType,
      cloudinarySecureUrl: attachment.cloudinarySecureUrl,
    })),
    // Required-at-submit fields (costType, estimatedDurationUnit, the four impact levels) are
    // allowed to come through as `undefined` here when never filled in — same as a brand-new
    // draft's WIZARD_DEFAULT_VALUES — the zod resolver catches genuine incompleteness at
    // submit-time, this is only ever used to seed form state, not validated directly.
    costOfImplementation: {
      ...WIZARD_DEFAULT_VALUES.costOfImplementation,
      ...kaizen.costOfImplementation,
      departmentIds: kaizen.costOfImplementation?.departmentIds ?? [],
    } as WizardFormValues["costOfImplementation"],
    fiveW1H: {
      what: kaizen.fiveW1H?.what ?? "",
      whereLocation: kaizen.fiveW1H?.whereLocation ?? "",
      whenOccurs: kaizen.fiveW1H?.whenOccurs ?? "",
      who: kaizen.fiveW1H?.who ?? "",
      why: kaizen.fiveW1H?.why ?? "",
      how: kaizen.fiveW1H?.how ?? "",
    },
    benefits: regularBenefits.map((benefit) => ({
      benefitType: benefit.benefitType,
      description: benefit.description,
      isCustom: benefit.isCustom ?? false,
    })),
    businessImpact: businessImpact?.description ?? "",
    estimatedSavings: estimatedSavings?.description ?? "",
  };
}
