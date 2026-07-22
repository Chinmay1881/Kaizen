"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/feedback/success-toast";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { DraftRecoveryPrompt } from "@/features/kaizen/components/draft-recovery-prompt";
import { Step1Basics } from "@/features/kaizen/components/steps/step-1-basics";
import { Step2Process } from "@/features/kaizen/components/steps/step-2-process";
import { Step3CostOfImplementation } from "@/features/kaizen/components/steps/step-3-cost-of-implementation";
import { Step4FiveW1H } from "@/features/kaizen/components/steps/step-4-five-w1h";
import { Step5Benefits } from "@/features/kaizen/components/steps/step-5-benefits";
import { Step6Review } from "@/features/kaizen/components/steps/step-6-review";
import { SuccessScreen } from "@/features/kaizen/components/success-screen";
import { WizardNavigation } from "@/features/kaizen/components/wizard-navigation";
import { WizardProgress } from "@/features/kaizen/components/wizard-progress";
import {
  useCreateKaizenDraft,
  useDeleteKaizenDraft,
  useSubmitKaizen,
  useUpdateKaizenDraft,
} from "@/features/kaizen/hooks/use-kaizen-draft-mutations";
import { useKaizenDetail } from "@/features/kaizen/hooks/use-kaizen-detail";
import {
  STEP_FIELD_NAMES,
  WIZARD_DEFAULT_VALUES,
  wizardSchema,
} from "@/features/kaizen/schemas/wizard-schema";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";
import { TOTAL_STEPS } from "@/features/kaizen/constants/wizard-steps";
import { buildUpdatePayload } from "@/features/kaizen/utils/build-update-payload";
import { kaizenDetailToFormValues } from "@/features/kaizen/utils/kaizen-detail-to-form-values";
import {
  clearStoredDraft,
  readStoredDraft,
  writeStoredDraft,
} from "@/features/kaizen/utils/draft-storage";
import { ApiError } from "@/lib/api-client";

const AUTOSAVE_INTERVAL_MS = 30_000;
const RESUBMITTABLE_STATUSES = new Set(["DRAFT", "NEEDS_CHANGES"]);

type WizardPhase = "loading" | "recovery" | "form" | "success";

interface KaizenWizardProps {
  /** "edit" reuses this exact same wizard/form for an existing Kaizen rather than a second form —
   * only how the wizard bootstraps (skips create-draft + draft-recovery, preloads from the real
   * row) and how the last step behaves (save vs. (re)submit) differ. */
  mode?: "create" | "edit";
  kaizenId?: string;
}

export function KaizenWizard({ mode = "create", kaizenId }: KaizenWizardProps) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const existingKaizenQuery = useKaizenDetail(mode === "edit" ? kaizenId ?? "" : "");

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: WIZARD_DEFAULT_VALUES,
    mode: "onBlur",
  });

  const [phase, setPhase] = useState<WizardPhase>(mode === "edit" ? "loading" : "loading");
  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(mode === "edit" ? kaizenId ?? null : null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successKaizenNumber, setSuccessKaizenNumber] = useState<string | null>(null);
  const [editHydrated, setEditHydrated] = useState(false);

  const createDraftMutation = useCreateKaizenDraft();
  const updateDraftMutation = useUpdateKaizenDraft();
  const submitMutation = useSubmitKaizen();
  const deleteDraftMutation = useDeleteKaizenDraft();

  const isSaving = createDraftMutation.isPending || updateDraftMutation.isPending;
  const isResubmit = mode === "edit" && RESUBMITTABLE_STATUSES.has(existingKaizenQuery.data?.status ?? "");

  // Create mode: decide whether to prompt for draft recovery once, on mount. Deliberately an
  // effect (not a useState lazy initializer): localStorage isn't available during SSR, so
  // computing this directly in render would risk a hydration mismatch between server and client
  // output. Edit mode skips this entirely — see the hook below.
  useEffect(() => {
    if (mode !== "create") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
    setPhase(readStoredDraft() ? "recovery" : "form");
  }, [mode]);

  // Edit mode: no localStorage draft concept — the real Kaizen row is already the persisted
  // state, so hydrate the form directly from the fetched detail once, then go straight to "form".
  useEffect(() => {
    if (mode !== "edit" || editHydrated || !existingKaizenQuery.data) return;
    form.reset(kaizenDetailToFormValues(existingKaizenQuery.data));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration, mirrors the create-mode effect above
    setEditHydrated(true);
    setPhase("form");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form is a stable RHF instance
  }, [mode, editHydrated, existingKaizenQuery.data]);

  // Preselect the user's own department for a brand-new (non-recovered) draft.
  useEffect(() => {
    if (
      mode === "create" &&
      phase === "form" &&
      !draftId &&
      currentUser?.department?.id &&
      !form.getValues("departmentId")
    ) {
      form.setValue("departmentId", currentUser.department.id);
    }
  }, [mode, phase, draftId, currentUser, form]);

  // Warn before leaving with unsaved changes — independent of autosave (which is best-effort and
  // silent on failure), this is a synchronous, unconditional guard against losing in-progress
  // typing to an accidental tab close or navigation.
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!form.formState.isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form]);

  function errorMessage(error: unknown): string {
    if (error instanceof ApiError) return error.message;
    return "Something went wrong. Please try again.";
  }

  async function persistProgress(step: number): Promise<string> {
    const values = form.getValues();
    let id = draftId;

    if (!id) {
      const created = await createDraftMutation.mutateAsync({
        title: values.title || undefined,
        departmentId: values.departmentId || undefined,
      });
      id = created.id;
      setDraftId(id);
    }

    await updateDraftMutation.mutateAsync({ id, input: buildUpdatePayload(values) });
    if (mode === "create") {
      writeStoredDraft({ draftId: id, step, values, savedAt: new Date().toISOString() });
    }
    return id;
  }

  // Autosave every 30s while a draft/kaizen id exists.
  useEffect(() => {
    if (!draftId || phase !== "form") return;
    const interval = setInterval(() => {
      persistProgress(currentStep).catch(() => {
        // Silent — the next explicit "Next"/"Submit" click will surface any real problem.
      });
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- persistProgress reads live form state via getValues()
  }, [draftId, phase, currentStep]);

  function handleResumeDraft() {
    const stored = readStoredDraft();
    if (stored) {
      form.reset(stored.values);
      setDraftId(stored.draftId);
      setCurrentStep(stored.step);
    }
    setPhase("form");
  }

  async function handleDiscardDraft() {
    const stored = readStoredDraft();
    clearStoredDraft();
    if (stored) {
      await deleteDraftMutation.mutateAsync(stored.draftId).catch(() => {
        // Best-effort cleanup — an orphaned draft row isn't harmful.
      });
    }
    setPhase("form");
  }

  async function handleNext() {
    const valid = await form.trigger(STEP_FIELD_NAMES[currentStep]);
    if (!valid) return;

    setSubmitError(null);
    try {
      await persistProgress(currentStep + 1);
      setCurrentStep((step) => Math.min(TOTAL_STEPS, step + 1));
    } catch (error) {
      setSubmitError(errorMessage(error));
    }
  }

  function handlePrevious() {
    setCurrentStep((step) => Math.max(1, step - 1));
  }

  function handleGoToStep(step: number) {
    setCurrentStep(step);
  }

  async function handleSubmit() {
    // Editing a Kaizen that's already SUBMITTED (and not being sent back through review) only
    // saves field changes — there's nothing to (re)submit, the Kaizen never left SUBMITTED.
    if (mode === "edit" && !isResubmit) {
      setSubmitError(null);
      try {
        const id = await persistProgress(currentStep);
        toast.success("Changes saved.");
        router.push(`/kaizen/${id}`);
      } catch (error) {
        setSubmitError(errorMessage(error));
      }
      return;
    }

    const valid = await form.trigger();
    if (!valid) return;

    setSubmitError(null);
    try {
      const id = await persistProgress(currentStep);
      const result = await submitMutation.mutateAsync(id);
      clearStoredDraft();

      if (mode === "edit") {
        toast.success(`${result.kaizenNumber} resubmitted for review.`);
        router.push(`/kaizen/${id}`);
        return;
      }

      setSuccessKaizenNumber(result.kaizenNumber);
      setPhase("success");
    } catch (error) {
      setSubmitError(errorMessage(error));
    }
  }

  function handleCreateAnother() {
    form.reset(WIZARD_DEFAULT_VALUES);
    setDraftId(null);
    setCurrentStep(1);
    setSuccessKaizenNumber(null);
    setSubmitError(null);
    setPhase("form");
  }

  if (mode === "edit" && existingKaizenQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load this Kaizen"
        description={errorMessage(existingKaizenQuery.error)}
        onRetry={() => existingKaizenQuery.refetch()}
      />
    );
  }

  if (phase === "loading") {
    return <LoadingSkeleton className="mx-auto h-96 w-full max-w-3xl" />;
  }

  if (phase === "success" && successKaizenNumber) {
    return (
      <SuccessScreen kaizenNumber={successKaizenNumber} onCreateAnother={handleCreateAnother} />
    );
  }

  return (
    <>
      <DraftRecoveryPrompt
        open={phase === "recovery"}
        onResume={handleResumeDraft}
        onDiscard={() => void handleDiscardDraft()}
      />

      {phase === "form" ? (
        <FormProvider {...form}>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <WizardProgress currentStep={currentStep} />

            {submitError ? (
              <ErrorState title="Couldn't save your progress" description={submitError} />
            ) : null}

            <Card>
              <CardContent className="p-6">
                {currentStep === 1 ? <Step1Basics /> : null}
                {currentStep === 2 ? <Step2Process draftId={draftId} /> : null}
                {currentStep === 3 ? <Step3CostOfImplementation /> : null}
                {currentStep === 4 ? <Step4FiveW1H /> : null}
                {currentStep === 5 ? <Step5Benefits /> : null}
                {currentStep === 6 ? <Step6Review onEditStep={handleGoToStep} /> : null}
              </CardContent>
            </Card>

            <WizardNavigation
              currentStep={currentStep}
              isSaving={isSaving}
              isSubmitting={submitMutation.isPending}
              submitLabel={mode === "edit" ? (isResubmit ? "Resubmit for Review" : "Save Changes") : "Submit Kaizen"}
              onPrevious={handlePrevious}
              onNext={() => void handleNext()}
              onSubmit={() => void handleSubmit()}
            />
          </div>
        </FormProvider>
      ) : null}
    </>
  );
}
